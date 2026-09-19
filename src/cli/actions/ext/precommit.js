const { logger } = require('./../../../shared/logger')

const Precommit = require('./../../../lib/services/precommit')
const catchAndLog = require('./../../../lib/helpers/catchAndLog')

function precommit (directory) {
  if (this.opts().clean !== undefined) {
    return require('./precommitClean')(this.opts().clean)
  }
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      successMessage,
      warnings
    } = new Precommit(directory, options).run()

    for (const warning of warnings) {
      logger.warn(warning.messageWithHelp || warning.message)
    }

    logger.success(successMessage)
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = precommit
