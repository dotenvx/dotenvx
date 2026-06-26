const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV = 'env'
const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const detectEncoding = require('./../helpers/detectEncoding')
const detectEncodingSync = require('./../helpers/detectEncodingSync')
const { encrypted, parse, parseSync } = require('@dotenvx/primitives')
const keynames = require('./../conventions/keynames')
const providers = require('./../providers')

function unresolvedEncryptedErrors (parsed, privateKeyName, processEnv) {
  const keys = []
  for (const [key, value] of Object.entries(parsed)) {
    if (encrypted(value)) {
      keys.push(key)
    }
  }

  if (keys.length < 1) {
    return []
  }

  return [new Errors({ key: keys.join(', '), privateKeyName: privateKeyName || 'DOTENV_PRIVATE_KEY', privateKey: processEnv[privateKeyName] || null }).missingPrivateKey()]
}

function inject (processEnv, parsed) {
  for (const key of Object.keys(parsed)) {
    processEnv[key] = parsed[key]
  }
}

function buildParseOptions ({ processEnv, overload, envKeysFilepath, provider }) {
  const options = {
    processEnv,
    overload,
    fk: envKeysFilepath
  }

  if (provider) {
    options.provider = provider
  } else {
    options.provider = null
  }

  return options
}

async function injectEnv ({ env, overload, processEnv, envKeysFilepath, provider }) {
  const row = {}
  row.type = TYPE_ENV
  row.string = env.value

  try {
    const parseProcessEnv = { ...processEnv }
    if (env.privateKeyName && Object.prototype.hasOwnProperty.call(processEnv, env.privateKeyName)) {
      parseProcessEnv[env.privateKeyName] = processEnv[env.privateKeyName]
    }

    const parseOptions = buildParseOptions({
      processEnv: parseProcessEnv,
      overload,
      envKeysFilepath,
      provider
    })

    const {
      parsed,
      injected,
      existed
    } = await parse(env.value, parseOptions)

    row.privateKeyName = env.privateKeyName || null
    row.parsed = parsed
    row.errors = unresolvedEncryptedErrors(parsed, env.privateKeyName, parseProcessEnv)
    row.injected = injected || {}
    row.existed = existed || {}

    inject(processEnv, row.parsed)
  } catch (e) {
    row.errors = [e]
  }

  return row
}

function injectEnvSync ({ env, overload, processEnv, envKeysFilepath, provider }) {
  const row = {}
  row.type = TYPE_ENV
  row.string = env.value

  try {
    const parseProcessEnv = { ...processEnv }
    if (env.privateKeyName && Object.prototype.hasOwnProperty.call(processEnv, env.privateKeyName)) {
      parseProcessEnv[env.privateKeyName] = processEnv[env.privateKeyName]
    }

    const parseOptions = buildParseOptions({
      processEnv: parseProcessEnv,
      overload,
      envKeysFilepath,
      provider
    })

    const {
      parsed,
      injected,
      existed
    } = parseSync(env.value, parseOptions)

    row.privateKeyName = env.privateKeyName || null
    row.parsed = parsed
    row.errors = unresolvedEncryptedErrors(parsed, env.privateKeyName, parseProcessEnv)
    row.injected = injected || {}
    row.existed = existed || {}

    inject(processEnv, row.parsed)
  } catch (e) {
    row.errors = [e]
  }

  return row
}

async function injectEnvFile ({ env, overload, processEnv, envKeysFilepath, provider, readableFilepaths }) {
  const row = {}
  row.type = TYPE_ENV_FILE
  row.filepath = env.value

  const filepath = path.resolve(env.value)
  try {
    const encoding = await detectEncoding(filepath)
    const src = await fsx.readFileX(filepath, { encoding })
    readableFilepaths.add(env.value)

    const { privateKeyName } = keynames(filepath)
    const fk = envKeysFilepath || (processEnv[privateKeyName] ? null : path.resolve(path.dirname(filepath), '.env.keys'))
    const parseOptions = buildParseOptions({
      processEnv,
      overload,
      envKeysFilepath: fk,
      provider
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = await parse(src, parseOptions)

    row.privateKeyName = privateKeyName
    row.src = src
    row.parsed = parsed
    row.injected = injected || {}
    row.errors = (errors || []).concat(unresolvedEncryptedErrors(parsed, privateKeyName, parseOptions.processEnv))
    row.existed = existed || {}

    inject(processEnv, parsed)
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') {
      row.errors = [new Errors({ envFilepath: env.value, filepath }).missingEnvFile()]
    } else {
      row.errors = [e]
    }
  }

  return row
}

function injectEnvFileSync ({ env, overload, processEnv, envKeysFilepath, provider, readableFilepaths }) {
  const row = {}
  row.type = TYPE_ENV_FILE
  row.filepath = env.value

  const filepath = path.resolve(env.value)
  try {
    const encoding = detectEncodingSync(filepath)
    const src = fsx.readFileXSync(filepath, { encoding })
    readableFilepaths.add(env.value)

    const { privateKeyName } = keynames(filepath)
    const fk = envKeysFilepath || (processEnv[privateKeyName] ? null : path.resolve(path.dirname(filepath), '.env.keys'))
    const parseOptions = buildParseOptions({
      processEnv,
      overload,
      envKeysFilepath: fk,
      provider
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = parseSync(src, parseOptions)

    row.privateKeyName = privateKeyName
    row.src = src
    row.parsed = parsed
    row.injected = injected || {}
    row.errors = (errors || []).concat(unresolvedEncryptedErrors(parsed, privateKeyName, parseOptions.processEnv))
    row.existed = existed || {}

    inject(processEnv, parsed)
  } catch (e) {
    if (e.code === 'ENOENT' || e.code === 'EISDIR') {
      row.errors = [new Errors({ envFilepath: env.value, filepath }).missingEnvFile()]
    } else {
      row.errors = [e]
    }
  }

  return row
}

async function envs (options = {}) {
  const processedEnvs = []
  const readableFilepaths = new Set()
  const processEnv = options.processEnv || process.env
  const envKeysFilepath = options.envKeysFilepath || options.envKeysFile || null
  const provider = options.noArmor ? null : await providers(options)

  for (const env of options.envs || []) {
    if (env.type === TYPE_ENV_FILE) {
      processedEnvs.push(await injectEnvFile({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        readableFilepaths
      }))
    } else if (env.type === TYPE_ENV) {
      processedEnvs.push(await injectEnv({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider
      }))
    }
  }

  return {
    processedEnvs,
    readableFilepaths: [...readableFilepaths]
  }
}

function envsSync (options = {}) {
  const processedEnvs = []
  const readableFilepaths = new Set()
  const processEnv = options.processEnv || process.env
  const envKeysFilepath = options.envKeysFilepath || options.envKeysFile || null
  const provider = options.noArmor ? null : providers.sync(options)

  for (const env of options.envs || []) {
    if (env.type === TYPE_ENV_FILE) {
      processedEnvs.push(injectEnvFileSync({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        readableFilepaths
      }))
    } else if (env.type === TYPE_ENV) {
      processedEnvs.push(injectEnvSync({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider
      }))
    }
  }

  return {
    processedEnvs,
    readableFilepaths: [...readableFilepaths]
  }
}

module.exports = envs
module.exports.sync = envsSync
