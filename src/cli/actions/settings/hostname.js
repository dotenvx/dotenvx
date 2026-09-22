const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')

function hostname () {
  try {
    const value = new Session().hostname()
    if (value && value.length > 1) {
      console.log(value)
      return
    }

    logger.error('missing hostname. Try running [dotenvx armor login].')
    return { exitCode: 1 }
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = hostname
