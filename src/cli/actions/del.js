const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const delTransform = require('./../../lib/transforms/del')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')

async function del (key) {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'deleting' })

  logger.debug(`key: ${key}`)
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []

  let errorCount = 0

  try {
    const { processedEnvs, changedFilepaths, unchangedFilepaths } = await delTransform({ envs, key })

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      logger.verbose(`deleting for ${processedEnv.envFilepath}`)
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      } else if (processedEnv.changed) {
        await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
        logger.verbose(`${processedEnv.key} deleted (${processedEnv.envFilepath})`)
      } else {
        logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
      }
    }

    if (changedFilepaths.length > 0) {
      logger.success(`◇ removed ${key} (${changedFilepaths.join(',')})`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`○ no change (${unchangedFilepaths})`)
    } else {
      // do nothing - scenario when no .env files found
    }

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = del
