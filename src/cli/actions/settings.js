const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function settings (key = null) {
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.settings(key)

  if (typeof value === 'object' && value !== null) {
    if (options.prettyPrint) {
      logger.blank(JSON.stringify(value, null, 2))
    } else {
      logger.blank(value)
    }
  } else {
    logger.blank(value)
  }
}

module.exports = settings
