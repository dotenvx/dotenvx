const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function settings () {
  const settings = main.settings()

  logger.info(settings)
}

module.exports = settings
