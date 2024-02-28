const logger = require('./../../shared/logger')

const Precommit = require('./../../lib/services/precommit')

function precommit () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      successMessage,
      warnings
    } = new Precommit(options).run()

    for (const warning of warnings) {
      logger.warnv(warning.message)
      if (warning.help) {
        logger.help(warning.help)
      }
    }

    logger.successvp(successMessage)
  } catch (error) {
    logger.errorvp(error.message)
    if (error.help) {
      logger.help(error.help)
    }

    process.exit(1)
  }
}

module.exports = precommit
