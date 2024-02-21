const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function get (key) {
  // debug args
  logger.debug(`key: ${key}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.get(key, options.envFile).run()
  logger.debug(`value: ${value}`)

  logger.blank(value)
}

module.exports = get
