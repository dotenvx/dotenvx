const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const encryptTransform = require('./../../lib/transforms/encrypt')
const withKeyFileLock = require('../../lib/helpers/withKeyFileLock')
const readKeyFileSnapshot = require('../../lib/helpers/readKeyFileSnapshot')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const statusReporter = require('../../lib/helpers/statusReporter')
const keypair = require('../../lib/resolvers/keypair')
const { publickeys, injectsummary } = require('@dotenvx/primitives')

async function encryptAction () {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'encrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []
  const ik = options.key
  const ek = options.excludeKey
  const fk = options.envKeysFile || '.env.keys'
  const noCreate = options.create === false
  const noArmor = options.armor === false
  const noNative = options.native === false || options.noNative === true

  const noBitwarden = options.bitwarden === false || options.noBitwarden === true
  const no1Password = options['1password'] === false || options.no1Password === true

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const { processedEnvs } = await encryptTransform({ with: options.with, profile: options.profile, envs, ik, ek, fk, noArmor, token: options.token, noCreate, noNative, no1Password, noBitwarden })

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      }
      if (!processedEnv.error && processedEnv.envSrc) {
        console.log(processedEnv.envSrc)
      }
    }

    return { exitCode: errorCount > 0 ? 1 : 0, errorCount }
  }

  try {
    // Prepare once: native/remote storage may have side effects.
    const { keysSrc, initialKeyFileSnapshot, keysChanged, processedEnvs, changedFilepaths, unchangedFilepaths } = await encryptTransform({ with: options.with, profile: options.profile, envs, ik, ek, fk, noArmor, token: options.token, noCreate, noNative, no1Password, noBitwarden })
    const writeEnvs = async () => {
      if (spinner) spinner.stop()
      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }
    }
    if (keysChanged && options.with === undefined) {
      if (initialKeyFileSnapshot.error) throw initialKeyFileSnapshot.error
      await withKeyFileLock(fk, async () => {
        const current = await readKeyFileSnapshot(fk)
        const before = initialKeyFileSnapshot.contents
        const matches = before === null
          ? current.contents === null
          : current.contents !== null && before.equals(current.contents)
        if (!matches) {
          const error = new Error(`[KEY_FILE_CHANGED] ${fk} changed during encryption. Retry the command.`)
          error.code = 'KEY_FILE_CHANGED'
          throw error
        }
        // Publish keys before ciphertext, holding the lock through every env.
        await fsx.writeKeyFile(fk, keysSrc)
        await writeEnvs()
      })
    } else {
      await writeEnvs()
    }

    // Existing public keys can encrypt without private-key access. Metadata
    // lookup must never turn successful encryption into a failure.
    for (const row of processedEnvs) {
      if (options.with !== undefined || options.quiet || row.error || row.keySources || !publickeys(row.envSrc || '').length) continue
      try {
        const resolved = await keypair({ ...options, envFile: [row.filepath], envKeysFile: fk, noArmor, noNative, no1Password, noBitwarden, includeProvider: true, onStatus: statusReporter(null) })
        row.keySources = { [publickeys(row.envSrc)[0]]: resolved.provider }
      } catch {}
    }

    const summaryRows = new Map(processedEnvs.map(row => [row.envFilepath, {
      filepath: row.envFilepath,
      publicKeys: publickeys(row.envSrc || ''),
      keySources: row.keySources
    }]))
    if (changedFilepaths.length > 0) {
      const summary = injectsummary.sources(changedFilepaths.map(filepath => summaryRows.get(filepath) || filepath))
      logger.success(`◈ encrypted ${summary.files.join(',')}${summary.suffix}`)
    } else if (unchangedFilepaths.length > 0) {
      const summary = injectsummary.sources(unchangedFilepaths.map(filepath => summaryRows.get(filepath) || filepath))
      logger.info(`○ no change to ${summary.files.join(',')}${summary.suffix}`)
    } else {
      // do nothing - scenario when no .env files found
    }

    return { exitCode: errorCount > 0 ? 1 : 0, errorCount }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = require('../../lib/events/cli')('encrypt', encryptAction)
