const { logger } = require('./../../shared/logger')

function catchAndLog (error) {
  const msg = error.messageWithHelp || error.message
  if (msg) {
    logger.error(msg)
  }
  if (error.debug) {
    logger.debug(error.debug)
  }
  if (error.code) {
    logger.debug(`ERROR_CODE: ${error.code}`)
  }
}

module.exports = catchAndLog
