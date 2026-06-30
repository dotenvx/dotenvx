// @ts-check
const path = require('path')
const { encrypted, parseSync } = require('@dotenvx/primitives')

// shared
const { setLogLevel, setLogName, setLogVersion, logger } = require('./../shared/logger')
const { getColor, bold } = require('./../shared/colors')

// resolvers
const envsResolver = require('./resolvers/envs')
const getResolver = require('./resolvers/get')
const lsResolver = require('./resolvers/ls')

const Session = require('./../db/session')

// transforms
const setTransform = require('./transforms/set')

// helpers
const buildEnvs = require('./helpers/buildEnvs')
const { determine } = require('./helpers/envResolution')
const fsx = require('./helpers/fsx')
const decryptKeyValue = require('./helpers/cryptography/decryptKeyValue')
const Errors = require('./helpers/errors')

function uniqueInjectedKeys (processedEnvs) {
  const result = new Set()
  for (const processedEnv of processedEnvs) {
    for (const key of Object.keys(processedEnv.injected || {})) {
      result.add(key)
    }
  }
  return result
}

/** @type {import('./main').config} */
const config = function (options = {}) {
  // allow user to set processEnv to write to
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  // overload
  const overload = options.overload || options.override

  // ignore
  const ignore = options.ignore || []

  // strict
  const strict = options.strict

  // envKeysFile
  const envKeysFile = options.envKeysFile

  if (options) {
    setLogLevel(options)
    setLogName(options)
    setLogVersion(options)
  }

  // dotenvx-armor related
  const noArmor = resolveNoArmor(options)

  try {
    let envs = buildEnvs(options)
    if (!options.envs) {
      envs = determine(envs, processEnv)
    }
    const {
      processedEnvs,
      readableFilepaths
    } = envsResolver.sync({
      envs,
      overload,
      processEnv,
      envKeysFile,
      noArmor,
      noSpinner: options.noSpinner,
      token: options.token
    })

    let lastError
    /** @type {Record<string, string>} */
    const parsedAll = {}
    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envFile') {
        logger.verbose(`loading env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      for (const error of processedEnv.errors || []) {
        if (ignore.includes(error.code)) {
          logger.verbose(`ignored: ${error.message}`)
          continue // ignore error
        }

        if (strict) throw error // throw if strict and not ignored

        lastError = error // surface later in { error }

        if (error.code === 'MISSING_ENV_FILE') {
          if (!options.convention) { // do not output error for conventions (too noisy)
            logger.error(error.messageWithHelp)
          }
        } else {
          logger.error(error.messageWithHelp)
        }
      }

      Object.assign(parsedAll, processedEnv.injected || {})
      Object.assign(parsedAll, processedEnv.existed || {}) // existed 'wins'

      // debug parsed
      logger.debug(processedEnv.parsed)

      // verbose/debug injected key/value
      for (const [key, value] of Object.entries(processedEnv.injected || {})) {
        logger.verbose(`${key} set`)
        logger.debug(`${key} set to ${value}`)
      }

      // verbose/debug existed key/value
      for (const [key, value] of Object.entries(processedEnv.existed || {})) {
        logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
        logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
      }
    }

    let msg = `injected env (${uniqueInjectedKeys(processedEnvs).size})`
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
    if (strict) throw error // throw immediately if strict

    logger.error(error.messageWithHelp)

    return { parsed: {}, error }
  }
}

/** @type {import('./main').parse} */
const parse = function (src, options = {}) {
  // allow user to set processEnv to read from
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  // private decryption key
  const privateKey = options.privateKey || null

  // overload
  const overload = options.overload || options.override

  // ignore
  const ignore = options.ignore || []

  if (privateKey) {
    processEnv = Object.assign({}, processEnv, { DOTENV_PRIVATE_KEY: privateKey })
  }

  const { parsed } = parseSync(src, { processEnv, overload })
  const errors = []

  for (const key of Object.keys(parsed)) {
    if (!encrypted(parsed[key])) {
      continue
    }

    if (!privateKey) {
      errors.push(new Errors({ key, privateKeyName: 'DOTENV_PRIVATE_KEY', privateKey }).missingPrivateKey())
      continue
    }

    try {
      parsed[key] = decryptKeyValue(key, parsed[key], 'DOTENV_PRIVATE_KEY', privateKey)
    } catch (error) {
      errors.push(error)
    }
  }

  // display any errors
  for (const error of errors) {
    if (ignore.includes(error.code)) {
      logger.verbose(`ignored: ${error.message}`)
      continue // ignore error
    }

    logger.error(error.messageWithHelp)
  }

  return parsed
}

/* @type {import('./main').set} */
const set = async function (key, value, options = {}) {
  // encrypt
  let encrypt = true
  if (options.plain) {
    encrypt = false
  } else if (options.encrypt === false) {
    encrypt = false
  }

  if (options) {
    setLogLevel(options)
    setLogName(options)
    setLogVersion(options)
  }

  const envs = buildEnvs(options)
  const envKeysFilepath = options.envKeysFile
  const noCreate = options.create === false
  const noArmor = resolveNoArmor(options)

  const {
    keysSrc,
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  } = await setTransform({
    envs,
    key,
    value,
    fk: envKeysFilepath,
    noArmor,
    noCreate,
    encrypt
  })

  if (keysSrc) {
    fsx.writeFileXSync(envKeysFilepath || '.env.keys', keysSrc)
  }

  let withEncryption = ''

  if (encrypt) {
    withEncryption = ' with encryption'
  }

  for (const processedEnv of processedEnvs) {
    logger.verbose(`setting for ${processedEnv.envFilepath}`)

    if (processedEnv.error) {
      const error = processedEnv.error
      const message = error.messageWithHelp || (error.help ? `${error.message}. ${error.help}` : error.message)
      logger.warn(message)
    } else {
      fsx.writeFileXSync(processedEnv.filepath, processedEnv.envSrc)

      logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
      logger.debug(`${processedEnv.key} set${withEncryption} to ${processedEnv.value} (${processedEnv.envFilepath})`)
    }
  }

  let keyAddedSuffix = ''
  const localKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.localPrivateKeyAdded)
  const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)

  if (remoteKeyAddedEnv) {
    keyAddedSuffix = ' · armored ⛨'
  }

  if (changedFilepaths.length > 0) {
    if (encrypt) {
      logger.success(`◈ encrypted ${key} (${changedFilepaths.join(',')})${keyAddedSuffix}`)
    } else {
      logger.success(`◇ set ${key} (${changedFilepaths.join(',')})`)
    }
  } else if (encrypt && localKeyAddedEnv) {
    const keyAddedEnvFilepath = localKeyAddedEnv.envFilepath || changedFilepaths[0] || '.env'
    logger.success(`◈ encrypted ${key} (${keyAddedEnvFilepath})${keyAddedSuffix}`)
  } else if (unchangedFilepaths.length > 0) {
    logger.info(`○ no change (${unchangedFilepaths})`)
  } else {
    // do nothing
  }

  // intentionally quiet: success line communicates key creation

  return {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

/* @type {import('./main').get} */
const get = async function (key, options = {}) {
  const envs = buildEnvs(options)
  const noArmor = resolveNoArmor(options)

  // ignore
  const ignore = options.ignore || []

  const { parsed, errors } = await getResolver({
    key,
    envs,
    overload: options.overload,
    all: options.all,
    envKeysFile: options.envKeysFile,
    noArmor
  })

  for (const error of errors || []) {
    if (ignore.includes(error.code)) {
      continue // ignore error
    }

    if (options.strict) throw error // throw immediately if strict

    logger.error(error.messageWithHelp)
  }

  if (key) {
    const single = parsed[key]
    if (single === undefined) {
      return undefined
    } else {
      return single
    }
  } else {
    if (options.format === 'eval') {
      let inline = ''
      for (const [key, value] of Object.entries(parsed)) {
        inline += `${key}=${escape(value)}\n`
      }
      inline = inline.trim()

      return inline
    } else if (options.format === 'shell') {
      let inline = ''
      for (const [key, value] of Object.entries(parsed)) {
        inline += `${key}=${value} `
      }
      inline = inline.trim()

      return inline
    } else if (options.format === 'colon') {
      let inline = ''
      for (const [key, value] of Object.entries(parsed)) {
        inline += `${key}:${value} `
      }
      inline = inline.trim()

      return inline
    } else {
      return parsed
    }
  }
}

/** @type {import('./main').ls} */
const ls = function (directory, envFile, excludeEnvFile) {
  return lsResolver({ directory, envFile, excludeEnvFile })
}

function resolveNoArmor (options = {}) {
  const sesh = new Session()
  return options.noArmor === true || options.noOps === true || (!options.token && sesh.noArmorSync())
}

module.exports = {
  // dotenv proxies
  config,
  parse,
  // actions related
  set,
  get,
  ls,
  // expose for libs depending on @dotenvx/dotenvx - like dotenvx-ops
  setLogLevel,
  logger,
  getColor,
  bold
}
