const logger = require('./../shared/logger')
const dotenv = require('dotenv')

const config = function (options) {
  return dotenv.config(options)
}

const parse = function (src) {
  const result = dotenv.parse(src)

  logger.debug(result)

  return result
}

const populate = function (processEnv, parsed, options = {}) {
  const result = dotenv.populate(processEnv, parsed, options = {})

  logger.debug(process.env)

  return result
}

module.exports = {
  config,
  parse,
  populate
}
