const { logger } = require('./../../shared/logger')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')

async function del (key) {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'deleting' })

  logger.debug(`key: ${key}`)
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []

  try {
    // TODO: wire to lib/transforms/del (and primitives delete counterpart to upsert)
    if (spinner) spinner.stop()

    logger.debug(`envs: ${JSON.stringify(envs)}`)
    logger.info(`○ del ${key} (not implemented yet)`)
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = del
