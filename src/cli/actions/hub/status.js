const store = require('./../../../shared/store')
const logger = require('./../../../shared/logger')

async function status () {
  logger.info(`logged in to ${store.getHostname()} as ${store.getUsername()}`)
}

module.exports = status
