// @ts-check
const path = require('path')
const { encrypted, parseSync, injectsummary, publickeys } = require('@dotenvx/primitives')

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
const logSetSummary = require('./helpers/logSetSummary')

// helpers
const buildEnvs = require('./helpers/buildEnvs')
const buildConfigEnvs = require('./helpers/buildConfigEnvs')
const buildCommandEnvs = require('./helpers/buildCommandEnvs')
const normalizeDotenvConfigPath = require('./helpers/normalizeDotenvConfigPath')
const determine = require('./helpers/envResolution/determine')
const escape = require('./helpers/escape')
const fsx = require('./helpers/fsx')
const decryptKeyValue = require('./helpers/cryptography/decryptKeyValue')
const Errors = require('./helpers/errors')
const normalizeDotenvConfigQuiet = require('./helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('./helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('./helpers/normalizeDotenvConfigIgnore')
const mask = require('./helpers/mask')
const maskProcessedEnvs = require('./helpers/maskProcessedEnvs')

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
const config = function (options = {}, events) {
  options = normalizeDotenvConfigQuiet(options)
  options = normalizeDotenvConfigConvention(options)
  options = normalizeDotenvConfigIgnore(options)

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
  const noNative = resolveNoNative(options)

  let fatal = false
  try {
    const envs = options.envs || determine(buildCommandEnvs(normalizeDotenvConfigPath(buildConfigEnvs(options), { ...process.env, ...processEnv })), { ...process.env, ...processEnv })
    const {
      processedEnvs,
      readableFilepaths
    } = envsResolver.sync({
      envs,
      overload,
      processEnv,
      envKeysFile,
      noArmor,
      noNative,
      no1Password: options.no1Password,
      noBitwarden: options.noBitwarden,
      noSpinner: options.noSpinner,
      token: options.token
    })

    if (options.mask !== undefined) {
      const showChar = options.mask === true ? 6 : options.mask
      maskProcessedEnvs(processedEnvs, processEnv, showChar)
    }

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

        if (strict) {
          fatal = true
          throw error
        }

        lastError = error // surface later in { error }

        if (error.code === 'MISSING_ENV_FILE') {
          if (!options.convention) { // do not output error for conventions (too noisy)
            logger.error(error.messageWithHelp || error.message)
          }
        } else {
          logger.error(error.messageWithHelp || error.message)
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

    if (events) events.add({ files: readableFilepaths, injected_count: uniqueInjectedKeys(processedEnvs).size })
    const summaryRows = readableFilepaths.map(filepath => {
      const row = processedEnvs.find(row => row.filepath === filepath)
      return {
        filepath,
        publicKeys: row ? publickeys(row.src || '') : [],
        keySources: row && row.keySources
      }
    })
    logger.success(injectsummary(uniqueInjectedKeys(processedEnvs).size, summaryRows))

    if (lastError) {
      if (events) events.fail(lastError)
      return { parsed: parsedAll, error: lastError }
    } else {
      return { parsed: parsedAll }
    }
  } catch (error) {
    if (events) events.fail(error)
    if (strict || fatal) throw error

    logger.error(error.messageWithHelp || error.message)

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

    logger.error(error.messageWithHelp || error.message)
  }

  return parsed
}

/* @type {import('./main').set} */
const set = async function (key, value, options = {}, events) {
  options = normalizeDotenvConfigQuiet(options)

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
  const noNative = resolveNoNative(options)

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
    noNative,
    no1Password: options.no1Password,
    noBitwarden: options.noBitwarden,
    noCreate,
    encrypt
  })

  if (keysSrc) {
    fsx.writeKeyFileSync(envKeysFilepath || '.env.keys', keysSrc)
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
    if (events) events.file(processedEnv, { key, output: 'file' })
  }
  if (events) events.add({ error_count: processedEnvs.filter(env => env.error).length })

  await logSetSummary(key, encrypt, { processedEnvs, changedFilepaths, unchangedFilepaths })

  return {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

/** @type {import('./main').get} */
const get = async function (key, options = {}, events) {
  const prepared = prepareGet(key, options)
  const resolved = await getResolver(prepared.resolverOptions)
  return getResult(key, prepared.options, resolved, events)
}

/** @type {import('./main').getSync} */
const getSync = function (key, options = {}) {
  const prepared = prepareGet(key, options)
  const resolved = getResolver.sync(prepared.resolverOptions)
  return getResult(key, prepared.options, resolved)
}

function prepareGet (key, options) {
  options = normalizeDotenvConfigConvention(options)
  options = normalizeDotenvConfigIgnore(options)

  const envs = buildEnvs(options)
  const noArmor = resolveNoArmor(options)
  const noNative = resolveNoNative(options)

  return {
    options,
    resolverOptions: {
      resolveDirectories: false,
      key,
      envs,
      overload: options.overload,
      all: options.all,
      envKeysFile: options.envKeysFile,
      noArmor,
      noNative,
      no1Password: options.no1Password,
      noBitwarden: options.noBitwarden
    }
  }
}

function getResult (key, options, { parsed, errors }, events) {
  const ignore = options.ignore || []

  if (options.mask !== undefined) {
    const showChar = options.mask === true ? 6 : options.mask
    for (const key of Object.keys(parsed)) {
      parsed[key] = mask(parsed[key], showChar)
    }
  }

  for (const error of errors || []) {
    if (ignore.includes(error.code)) {
      continue // ignore error
    }

    if (events) events.fail(error)
    if (options.strict) throw error // throw immediately if strict

    logger.error(error.messageWithHelp || error.message)
  }

  if (events) events.add({ error_count: (errors || []).filter(error => !ignore.includes(error.code)).length })
  if (key) {
    const single = parsed[key]
    if (single === undefined) {
      return undefined
    } else {
      return single
    }
  } else {
    if (options.format === 'eval' || options.format === 'eval-export') {
      const prefix = options.format === 'eval-export' ? 'export ' : ''
      let inline = ''
      for (const [key, value] of Object.entries(parsed)) {
        inline += `${prefix}${key}=${escape(value)}\n`
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
const ls = async function (directory, envFile, excludeEnvFile, onDirectory) {
  return await lsResolver({ directory, envFile, excludeEnvFile, onDirectory })
}

function resolveNoArmor (options = {}) {
  const sesh = new Session()
  return options.noArmor === true || (!options.token && sesh.noArmorSync())
}

function resolveNoNative (options = {}) {
  return options.noNative === true || options.native === false
}

/** @type {import('./main').withEvents} */
const withEvents = () => require('./events/sdk')({ config, get, set })

// Keep named bindings here so Node can detect CommonJS exports for ESM imports.
module.exports = {
  withEvents,
  // dotenv proxies
  config,
  parse,
  // actions related
  set,
  get,
  getSync,
  ls,
  // expose for libs depending on @dotenvx/dotenvx
  setLogLevel,
  logger,
  getColor,
  bold
}
