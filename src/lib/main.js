const logger = require('./../shared/logger')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

// services
const Encrypt = require('./services/encrypt')
const Ls = require('./services/ls')
const Get = require('./services/get')
const Genexample = require('./services/genexample')
const Settings = require('./services/settings')

// helpers
const dotenvEval = require('./helpers/dotenvEval')

// proxies to dotenv
const config = function (options) {
  const env = dotenv.config(options)

  // if processEnv passed also pass to expand
  if (options && options.processEnv) {
    env.processEnv = options.processEnv
  }
  const expanded = dotenvExpand.expand(env)

  // if processEnv passed also pass to eval
  if (options && options.processEnv) {
    expanded.processEnv = options.processEnv
  }
  const evaluated = dotenvEval.eval(expanded)

  return evaluated
}

const configDotenv = function (options) {
  return dotenv.configDotenv(options)
}

const parse = function (src) {
  return dotenv.parse(src)
}

// actions related
const encrypt = function (directory, envFile) {
  return new Encrypt(directory, envFile).run()
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
  ls,
  get,
  genexample,
  // settings
  settings,
  // misc/cleanup
  decrypt
}
