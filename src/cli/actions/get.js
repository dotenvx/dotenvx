const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function get (key) {
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.get(key, options.envFile, options.overload, options.all)

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

module.exports = get
