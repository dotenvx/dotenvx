const fsx = require('./../helpers/fsx')
const path = require('path')
const { encrypted } = require('@dotenvx/primitives')

const TYPE_ENV = 'env'
const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const detectEncoding = require('./../helpers/detectEncoding')
const detectEncodingSync = require('./../helpers/detectEncodingSync')
const keynames = require('./../conventions/keynames')
const providers = require('./../providers')
const decryptors = require('./../decryptors')
const parseWithDecryptor = require('./../helpers/parseWithDecryptor')
const resolveOnePassword = require('./../helpers/resolveOnePassword')
const resolveBitwardenPassword = require('./../helpers/resolveBitwardenPassword')

function unresolvedEncryptedErrors (parsed) {
  const keys = []
  for (const [key, value] of Object.entries(parsed)) {
    if (encrypted(value)) {
      keys.push(key)
    }
  }

  if (keys.length < 1) {
    return []
  }

  return [new Errors({ message: `could not decrypt ${keys.join(', ')}` }).decryptionFailed()]
}

function decryptErrors (parsed, errors) {
  const mappedErrors = (errors || []).map(error => {
    if (error instanceof Error) return error

    return new Errors({
      code: error.code,
      message: error.message,
      help: error.help
    }).custom()
  })

  if (mappedErrors.length > 0) {
    return mappedErrors
  }

  return unresolvedEncryptedErrors(parsed)
}

function inject (processEnv, parsed) {
  for (const key of Object.keys(parsed)) {
    processEnv[key] = parsed[key]
  }
}

function buildParseOptions ({ processEnv, overload, envKeysFilepath, provider, decryptor }) {
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

  if (decryptor) {
    options.decryptor = decryptor
  }

  return options
}

async function injectEnv ({ env, overload, processEnv, envKeysFilepath, provider, decryptor, no1Password, noBitwarden, onStatus }) {
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
      provider,
      decryptor
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = await parseWithDecryptor(env.value, parseOptions)

    row.parsed = parsed
    row.errors = decryptErrors(parsed, errors)
    row.injected = injected || {}
    row.existed = existed || {}

    if (!no1Password) {
      const result = await resolveOnePassword(row.injected, { onStatus })
      row.errors.push(...result.errors)
      Object.assign(row.parsed, row.injected)
    }

    if (!noBitwarden) {
      const passwordResult = await resolveBitwardenPassword(row.injected, { onStatus })
      row.errors.push(...passwordResult.errors)

      Object.assign(row.parsed, row.injected)
    }

    inject(processEnv, row.parsed)
  } catch (e) {
    if (e.code === 'PROMPT_CANCELLED') throw e
    row.errors = [e]
  }

  return row
}

function injectEnvSync ({ env, overload, processEnv, envKeysFilepath, provider, decryptor, no1Password, noBitwarden }) {
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
      provider,
      decryptor
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = parseWithDecryptor.sync(env.value, parseOptions)

    row.parsed = parsed
    row.errors = decryptErrors(parsed, errors)
    row.injected = injected || {}
    row.existed = existed || {}

    if (!no1Password) {
      const result = resolveOnePassword.sync(row.injected)
      row.errors.push(...result.errors)
      Object.assign(row.parsed, row.injected)
    }

    if (!noBitwarden) {
      const passwordResult = resolveBitwardenPassword.sync(row.injected)
      row.errors.push(...passwordResult.errors)

      Object.assign(row.parsed, row.injected)
    }

    inject(processEnv, row.parsed)
  } catch (e) {
    row.errors = [e]
  }

  return row
}

async function injectEnvFile ({ env, overload, processEnv, envKeysFilepath, provider, decryptor, readableFilepaths, no1Password, noBitwarden, onStatus }) {
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
      provider,
      decryptor
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = await parseWithDecryptor(src, parseOptions)

    row.src = src
    row.parsed = parsed
    row.injected = injected || {}
    row.errors = decryptErrors(parsed, errors)
    row.existed = existed || {}

    if (!no1Password) {
      const result = await resolveOnePassword(row.injected, { onStatus })
      row.errors.push(...result.errors)
      Object.assign(row.parsed, row.injected)
    }

    if (!noBitwarden) {
      const passwordResult = await resolveBitwardenPassword(row.injected, { onStatus })
      row.errors.push(...passwordResult.errors)

      Object.assign(row.parsed, row.injected)
    }

    inject(processEnv, parsed)
  } catch (e) {
    if (e.code === 'PROMPT_CANCELLED') throw e
    if (e.code === 'ENOENT' || e.code === 'EISDIR') {
      row.errors = [new Errors({ envFilepath: env.value, filepath }).missingEnvFile()]
    } else {
      row.errors = [e]
    }
  }

  return row
}

function injectEnvFileSync ({ env, overload, processEnv, envKeysFilepath, provider, decryptor, readableFilepaths, no1Password, noBitwarden }) {
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
      provider,
      decryptor
    })

    const {
      parsed,
      errors,
      injected,
      existed
    } = parseWithDecryptor.sync(src, parseOptions)

    row.src = src
    row.parsed = parsed
    row.injected = injected || {}
    row.errors = decryptErrors(parsed, errors)
    row.existed = existed || {}

    if (!no1Password) {
      const result = resolveOnePassword.sync(row.injected)
      row.errors.push(...result.errors)
      Object.assign(row.parsed, row.injected)
    }

    if (!noBitwarden) {
      const passwordResult = resolveBitwardenPassword.sync(row.injected)
      row.errors.push(...passwordResult.errors)

      Object.assign(row.parsed, row.injected)
    }

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
  const no1Password = options.no1Password === true || process.env.DOTENVX_NO_1PASSWORD === 'true'
  const noBitwarden = options.noBitwarden === true || process.env.DOTENVX_NO_BITWARDEN === 'true'
  const provider = await providers(options)
  const decryptor = await decryptors(options)
  for (const env of options.envs || []) {
    if (env.type === TYPE_ENV_FILE) {
      processedEnvs.push(await injectEnvFile({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        decryptor,
        readableFilepaths,
        no1Password,
        noBitwarden,
        onStatus: options.onStatus
      }))
    } else if (env.type === TYPE_ENV) {
      processedEnvs.push(await injectEnv({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        decryptor,
        no1Password,
        noBitwarden,
        onStatus: options.onStatus
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
  const no1Password = options.no1Password === true || process.env.DOTENVX_NO_1PASSWORD === 'true'
  const noBitwarden = options.noBitwarden === true || process.env.DOTENVX_NO_BITWARDEN === 'true'
  const provider = providers.sync(options)
  const decryptor = decryptors.sync(options)

  for (const env of options.envs || []) {
    if (env.type === TYPE_ENV_FILE) {
      processedEnvs.push(injectEnvFileSync({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        decryptor,
        readableFilepaths,
        no1Password,
        noBitwarden
      }))
    } else if (env.type === TYPE_ENV) {
      processedEnvs.push(injectEnvSync({
        env,
        overload: options.overload,
        processEnv,
        envKeysFilepath,
        provider,
        decryptor,
        no1Password,
        noBitwarden
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
