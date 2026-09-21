const { logger } = require('../../shared/logger')

const Prebuild = require('../../lib/services/prebuild')
const catchAndLog = require('../../lib/helpers/catchAndLog')

function protectDocker (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      successMessage,
      warnings
    } = new Prebuild(directory, options).run()

    for (const warning of warnings) {
      logger.warn(warning.messageWithHelp || warning.message)
    }

    logger.success(successMessage)
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = protectDocker
