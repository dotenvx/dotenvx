const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const encryptTransform = require('./../../lib/transforms/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
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
    const { processedEnvs } = await encryptTransform({ profile: options.profile, envs, ik, ek, fk, noArmor, token: options.token, noCreate, noNative, no1Password, noBitwarden })

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
    const { keysSrc, processedEnvs, changedFilepaths, unchangedFilepaths } = await encryptTransform({ profile: options.profile, envs, ik, ek, fk, noArmor, token: options.token, noCreate, noNative, no1Password, noBitwarden })

    if (keysSrc) {
      await fsx.writeKeyFile(fk, keysSrc)
    }

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

    // Existing public keys can encrypt without private-key access. Metadata
    // lookup must never turn successful encryption into a failure.
    for (const row of processedEnvs) {
      if (options.quiet || row.error || row.keySources || !publickeys(row.envSrc || '').length) continue
      try {
        const resolved = await keypair({ ...options, envFile: [row.filepath], envKeysFile: fk, noArmor, noNative, no1Password, noBitwarden, includeProvider: true })
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
      logger.info(`○ no change ${summary.files.join(',')}${summary.suffix}`)
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
