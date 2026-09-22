const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')

function off () {
  try {
    new Session().turnOff()
    logger.success('✔ armor: off')
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = off
