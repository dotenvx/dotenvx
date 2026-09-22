const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')

function on () {
  try {
    new Session().turnOn()
    logger.success('✔ armor: on')
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = on
