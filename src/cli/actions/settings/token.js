const { logger } = require('../../../shared/logger')
const Session = require('../../../db/session')
const mask = require('../../../lib/helpers/mask')

function token () {
  const options = this.opts()

  try {
    const value = new Session().token()
    if (value && value.length > 1) {
      console.log(options.unmask ? value : mask(value))
      return
    }

    logger.error('missing token. Try generating one with [dotenvx armor login].')
    return { exitCode: 1 }
  } catch (error) {
    logger.error(error.message)
    return { exitCode: 1, error }
  }
}

module.exports = token
