const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function set (keyValue) {
  logger.debug(`keyValue: ${keyValue}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  logger.blank0(keyValue)

  // 1. read .env file
  // 2. parse it for key/values ?
  // 3. locate if already an existing key?
  // 4. write/append the new key=value - start here

  const result = main.set(keyValue, options.envFile)

  logger.blank(result)

  // if (typeof value === 'object' && value !== null) {
  //   if (options.prettyPrint) {
  //     logger.blank0(JSON.stringify(value, null, 2))
  //   } else {
  //     logger.blank0(value)
  //   }
  // } else {
  //   logger.blank0(value)
  // }
}

module.exports = set
