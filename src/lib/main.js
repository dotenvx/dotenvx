const path = require('path')
const { logger } = require('./../shared/logger')
const dotenv = require('dotenv')

// services
const Ls = require('./services/ls')
const Get = require('./services/get')
const Run = require('./services/run')
const Sets = require('./services/sets')
const Status = require('./services/status')
const Encrypt = require('./services/encrypt')
const Genexample = require('./services/genexample')
const Settings = require('./services/settings')
const VaultEncrypt = require('./services/vaultEncrypt')

// helpers
const dotenvOptionPaths = require('./helpers/dotenvOptionPaths')
const { setLogLevel } = require('../shared/logger')

// proxies to dotenv
const config = function (options = {}) {
  // allow user to set processEnv to write to
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  // overload
  const overload = options.overload || options.override

  // DOTENV_KEY
  let DOTENV_KEY = process.env.DOTENV_KEY
  if (options && options.DOTENV_KEY) {
    DOTENV_KEY = options.DOTENV_KEY
  }

  if (options) setLogLevel(options)

  // build envs using user set option.path
  const optionPaths = dotenvOptionPaths(options) // [ '.env' ]

  try {
    const envs = []
    for (const optionPath of optionPaths) {
      // if DOTENV_KEY is set then assume we are checking envVaultFile
      if (DOTENV_KEY) {
        envs.push({ type: 'envVaultFile', value: path.join(path.dirname(optionPath), '.env.vault') })
      } else {
        envs.push({ type: 'envFile', value: optionPath })
      }
    }

    const {
      processedEnvs,
      readableFilepaths,
      uniqueInjectedKeys
    } = new Run(envs, overload, DOTENV_KEY, processEnv).run()

    let lastError
    const parsedAll = {}

    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envVaultFile') {
        logger.verbose(`loading env from encrypted ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
        logger.debug(`decrypting encrypted env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.type === 'envFile') {
        logger.verbose(`loading env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.error) {
        lastError = processedEnv.error

        if (processedEnv.error.code === 'MISSING_ENV_FILE') {
          // do not warn for conventions (too noisy)
          if (!options.convention) {
            logger.warnv(processedEnv.error)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.filepath}] and re-run [dotenvx run -- yourcommand]`)
          }
        } else {
          logger.warnv(processedEnv.error)
        }
      } else {
        Object.assign(parsedAll, processedEnv.injected)
        Object.assign(parsedAll, processedEnv.preExisted) // preExisted 'wins'

        // debug parsed
        const parsed = processedEnv.parsed
        logger.debug(parsed)

        // verbose/debug injected key/value
        const injected = processedEnv.injected
        for (const [key, value] of Object.entries(injected)) {
          logger.verbose(`${key} set`)
          logger.debug(`${key} set to ${value}`)
        }

        // verbose/debug preExisted key/value
        const preExisted = processedEnv.preExisted
        for (const [key, value] of Object.entries(preExisted)) {
          logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
          logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
        }
      }
    }

    let msg = `injecting env (${uniqueInjectedKeys.length})`
    if (readableFilepaths.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}`
    }
    logger.successv(msg)

    if (lastError) {
      return { parsed: parsedAll, error: lastError }
    } else {
      return { parsed: parsedAll }
    }
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }

    return { parsed: {}, error }
  }
}

const configDotenv = function (options) {
  return dotenv.configDotenv(options)
}

const parse = function (src) {
  return dotenv.parse(src)
}

// DEPRECATED: will became the same function as convert
const encrypt = function (directory, envFile) {
  return new VaultEncrypt(directory, envFile).run()
}

const vaultEncrypt = function (directory, envFile) {
  return new VaultEncrypt(directory, envFile).run()
}

const ls = function (directory, envFile) {
  return new Ls(directory, envFile).run()
}

const genexample = function (directory, envFile) {
  return new Genexample(directory, envFile).run()
}

const get = function (key, envs = [], overload = false, DOTENV_KEY = '', all = false) {
  return new Get(key, envs, overload, DOTENV_KEY, all).run()
}

const set = function (key, value, envFile, encrypt) {
  return new Sets(key, value, envFile, encrypt).run()
}

const convert = function (envFile) {
  return new Encrypt(envFile).run()
}

const status = function (directory) {
  return new Status(directory).run()
}

const settings = function (key = null) {
  return new Settings(key).run()
}

// misc/cleanup
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

module.exports = {
  // dotenv proxies
  config,
  configDotenv,
  parse,
  // actions related
  encrypt,
  vaultEncrypt,
  ls,
  get,
  set,
  convert,
  status,
  genexample,
  // settings
  settings,
  // misc/cleanup
  decrypt
}
