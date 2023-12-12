const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')

async function token () {
  logger.blank(store.get('DOTENVX_TOKEN'))
}

module.exports = token
