const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')

async function token () {
  logger.blank(store.getToken())
}

module.exports = token
