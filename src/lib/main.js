// @ts-check
const path = require('path')
const dotenv = require('dotenv')

// shared
const { setLogLevel, logger } = require('./../shared/logger')
const { getColor, bold } = require('./../shared/colors')

// services
const Ls = require('./services/ls')
const Get = require('./services/get')
const Run = require('./services/run')
const Keypair = require('./services/keypair')
const Genexample = require('./services/genexample')

// helpers
const conventions = require('./helpers/conventions')
const dotenvOptionPaths = require('./helpers/dotenvOptionPaths')

// proxies to dotenv

/** @type {import('./main').config} */
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
    let envs = []
    // handle shorthand conventions - like --convention=nextjs
    if (options.convention) {
      envs = conventions(options.convention).concat(envs)
    }

    if (process.env.DOTENV_KEY) {
      logger.warn('DEPRECATION NOTICE: Setting DOTENV_KEY with .env.vault is deprecated.')
      logger.warn('DEPRECATION NOTICE: Run [dotenvx ext vault migrate] for instructions on converting your .env.vault file to encrypted .env files (using public key encryption algorithm secp256k1)')
      logger.warn('DEPRECATION NOTICE: Read more at [https://github.com/dotenvx/dotenvx/blob/main/CHANGELOG.md#0380]')
    }

    for (const optionPath of optionPaths) {
      // if DOTENV_KEY is set then assume we are checking envVaultFile
      if (DOTENV_KEY) {
        envs.push({
          type: 'envVaultFile',
          value: path.join(path.dirname(optionPath), '.env.vault')
        })
      } else {
        envs.push({ type: 'envFile', value: optionPath })
      }
    }

    const { processedEnvs, readableFilepaths, uniqueInjectedKeys } = new Run(
      envs,
      overload,
      DOTENV_KEY,
      processEnv
    ).run()

    let lastError
    /** @type {Record<string, string>} */
    const parsedAll = {}

    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envVaultFile') {
        logger.verbose(
          `loading env from encrypted ${processedEnv.filepath} (${path.resolve(
            processedEnv.filepath
          )})`
        )
        logger.debug(
          `decrypting encrypted env from ${
            processedEnv.filepath
          } (${path.resolve(processedEnv.filepath)})`
        )
      }

      if (processedEnv.type === 'envFile') {
        logger.verbose(
          `loading env from ${processedEnv.filepath} (${path.resolve(
            processedEnv.filepath
          )})`
        )
      }

      if (processedEnv.error) {
        lastError = processedEnv.error

        if (processedEnv.error.code === 'MISSING_ENV_FILE') {
          // do not warn for conventions (too noisy)
          if (!options.convention) {
            logger.warnv(processedEnv.error.message)
            logger.help(
              `? add one with [echo "HELLO=World" > ${processedEnv.filepath}] and re-run [dotenvx run -- yourcommand]`
            )
          }
        } else {
          logger.warnv(processedEnv.error.message)
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
          logger.verbose(
            `${key} pre-exists (protip: use --overload to override)`
          )
          logger.debug(
            `${key} pre-exists as ${value} (protip: use --overload to override)`
          )
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

/** @type {import('./main').configDotenv} */
const configDotenv = function (options) {
  return dotenv.configDotenv(options)
}

/** @type {import('./main').parse} */
const parse = function (src) {
  return dotenv.parse(src)
}

/** @type {import('./main').ls} */
const ls = function (directory, envFile, excludeEnvFile) {
  return new Ls(directory, envFile, excludeEnvFile).run()
}

/** @type {import('./main').genexample} */
const genexample = function (directory, envFile) {
  return new Genexample(directory, envFile).run()
}

/** @type {import('./main').get} */
const get = function (
  key,
  envs = [],
  overload = false,
  DOTENV_KEY = '',
  all = false
) {
  return new Get(key, envs, overload, DOTENV_KEY, all).run()
}

/** @type {import('./main').keypair} */
const keypair = function (envFile, key) {
  return new Keypair(envFile, key).run()
}

module.exports = {
  // dotenv proxies
  config,
  configDotenv,
  parse,
  // actions related
  ls,
  get,
  keypair,
  genexample,
  // expose for libs depending on @dotenvx/dotenvx - like dotenvx-pro
  setLogLevel,
  logger,
  getColor,
  bold
}
