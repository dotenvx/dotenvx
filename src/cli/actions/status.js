const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function status () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const value = main.status()
  logger.blank(value)
}

module.exports = status
