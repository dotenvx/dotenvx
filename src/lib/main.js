const logger = require('./../shared/logger')
const dotenv = require('dotenv')

const config = function (options) {
  return dotenv.config(options)
}

const decrypt = function (encrypted, keyStr) {
  try {
    return dotenv.decrypt(encrypted, keyStr)
  } catch (e) {
    switch (e.code) {
      case 'DECRYPTION_FAILED':
        // more helpful error when decryption fails
        logger.error('[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
        logger.help('[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.')
        logger.debug(`[DECRYPTION_FAILED] DOTENV_KEY is ${process.env.DOTENV_KEY}`)
        process.exit(1)
        break
      default:
        throw e
    }
  }
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
