const { logger } = require('./../../../shared/logger')

const Prebuild = require('./../../../lib/services/prebuild')

function prebuild (directory) {
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
      logger.warn(warning.messageWithHelp)
    }

    logger.success(successMessage)
  } catch (error) {
    logger.error(error.messageWithHelp)

    process.exit(1)
  }
}

module.exports = prebuild
