const { logger } = require('./../../shared/logger')

function catchAndLog (error) {
  logger.error(error.messageWithHelp || error.message)
  if (error.debug) {
    logger.debug(error.debug)
  }
  if (error.code) {
    logger.debug(`ERROR_CODE: ${error.code}`)
  }
}

module.exports = catchAndLog
