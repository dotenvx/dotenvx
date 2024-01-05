const logger = require('./../shared/logger')
const dotenv = require('dotenv')

const config = function (options) {
  return dotenv.config(options)
}

const decrypt = function (encrypted, keyStr) {
  return dotenv.decrypt(encrypted, keyStr)
}

const configDotenv = function (options) {
  return dotenv.configDotenv(options)
}

const parse = function (src) {
  const result = dotenv.parse(src)

  logger.debug(result)

  return result
}

const inject = function (processEnv = {}, parsed = {}, overload = false) {
  if (typeof parsed !== 'object') {
    throw new Error('OBJECT_REQUIRED: Please check the parsed argument being passed to inject')
  }

  const injected = new Set()
  const preExisting = new Set()

  // set processEnv
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (overload === true) {
        processEnv[key] = parsed[key]
        injected.add(key)

        logger.verbose(`${key} set`)
        logger.debug(`${key} set to ${parsed[key]}`)
      } else {
        preExisting.add(key)

        logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
        logger.debug(`${key} pre-exists as ${processEnv[key]} (protip: use --overload to override)`)
      }
    } else {
      processEnv[key] = parsed[key]
      injected.add(key)

      logger.verbose(`${key} set`)
      logger.debug(`${key} set to ${parsed[key]}`)
    }
  }

  return {
    injected,
    preExisting
  }
}

module.exports = {
  config,
  configDotenv,
  decrypt,
  parse,
  inject
}
