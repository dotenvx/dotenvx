const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')

async function token () {
  logger.debug(store.configPath())
  logger.blank(store.getToken())
}

module.exports = token
