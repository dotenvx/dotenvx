const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')

function username () {
  try {
    const value = new Session().username()
    if (value) {
      console.log(value)
      return
    }

    logger.error('login required. Try running [dotenvx armor login].')
    return { exitCode: 1 }
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = username
