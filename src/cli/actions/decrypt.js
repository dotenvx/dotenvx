const statusReporter = require('../../lib/helpers/statusReporter')
const { publickeys, injectsummary } = require('@dotenvx/primitives')
const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')

const decryptTransform = require('./../../lib/transforms/decrypt')

async function decrypt () {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noArmor = options.armor === false || (await sesh.noArmor())
  const noNative = options.native === false || options.noNative === true

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = await decryptTransform({
      envs,
      ik: options.key,
      ek: options.excludeKey,
      fk: options.envKeysFile,
      noArmor,
      noNative,
      onStatus: statusReporter(spinner)
    })

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      } else {
        console.log(processedEnv.envSrc)
      }
    }

    return { exitCode: errorCount > 0 ? 1 : 0, errorCount }
  } else {
    try {
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await decryptTransform({
        envs,
        ik: options.key,
        ek: options.excludeKey,
        fk: options.envKeysFile,
        noArmor,
        noNative,
        onStatus: statusReporter(spinner)
      })

      for (const processedEnv of processedEnvs) {
        logger.verbose(`decrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)

        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
        }

        if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`decrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      const summaryRows = new Map(processedEnvs.map(row => [row.envFilepath, {
        filepath: row.envFilepath,
        publicKeys: publickeys(row.envSrc || ''),
        keyCustodies: Object.values(row.custodies || {})
      }]))
      if (changedFilepaths.length > 0) {
        const summary = injectsummary.sources(changedFilepaths.map(filepath => summaryRows.get(filepath) || filepath))
        logger.success(`◇ decrypted ${summary.files.join('; ')}${summary.suffix}`)
      } else if (unchangedFilepaths.length > 0) {
        const summary = injectsummary.sources(unchangedFilepaths.map(filepath => summaryRows.get(filepath) || filepath))
        logger.info(`○ no change to ${summary.files.join('; ')}${summary.suffix}`)
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
}

module.exports = require('../../lib/events/cli')('decrypt', decrypt)
