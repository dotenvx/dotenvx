const { logger } = require('../../shared/logger')

const Prebuild = require('../../lib/services/prebuild')
const catchAndLog = require('../../lib/helpers/catchAndLog')

async function protectDocker (directory) {
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

    this.events.add({ action: 'docker', warning_count: warnings.length })
    logger.success(successMessage)
  } catch (error) {
    catchAndLog(error)
    return await this.events.exit(1, error)
  }
}

module.exports = protectDocker
