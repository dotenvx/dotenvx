const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV = 'env'
const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const detectEncoding = require('./../helpers/detectEncoding')
const detectEncodingSync = require('./../helpers/detectEncodingSync')
const { encrypted, parse, parseSync } = require('@dotenvx/primitives')
const armorProvider = require('./../providers/armor/index')
const keynames = require('./../conventions/keynames')

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

function armorProviderSync (publicKeyHex) {
  const { createSyncFn } = require('synckit')
  const runProvider = createSyncFn(require.resolve('./../providers/worker'))
  return runProvider(require.resolve('./../providers/armor/index'), publicKeyHex)
}

class Run {
  constructor (envs = [], overload = false, processEnv = process.env, envKeysFilepath = null, noArmor = false, options = {}) {
    this.envs = envs
    this.overload = overload
    this.processEnv = processEnv
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.noSpinner = options.noSpinner
    this.token = options.token
    this.command = options.command
    this.onStatus = options.onStatus

    this.processedEnvs = []
    this.readableFilepaths = new Set()
  }

  runSync () {
    // example
    // envs [
    //   { type: 'env', value: 'HELLO=one' },
    //   { type: 'envFile', value: '.env' },
    //   { type: 'env', value: 'HELLO=three' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._injectEnvFileSync(env.value)
      } else if (env.type === TYPE_ENV) {
        this._injectEnvSync(env.value, env.privateKeyName)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      readableFilepaths: [...this.readableFilepaths]
    }
  }

  async run () {
    // example
    // envs [
    //   { type: 'env', value: 'HELLO=one' },
    //   { type: 'envFile', value: '.env' },
    //   { type: 'env', value: 'HELLO=three' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        await this._injectEnvFile(env.value)
      } else if (env.type === TYPE_ENV) {
        await this._injectEnv(env.value, env.privateKeyName)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      readableFilepaths: [...this.readableFilepaths]
    }
  }

  _injectEnvSync (env, privateKeyName = null) {
    const row = {}
    row.type = TYPE_ENV
    row.string = env

    try {
      const processEnv = { ...this.processEnv }
      if (privateKeyName && Object.prototype.hasOwnProperty.call(this.processEnv, privateKeyName)) {
        processEnv[privateKeyName] = this.processEnv[privateKeyName]
      }
      const parseOptions = {
        processEnv,
        overload: this.overload,
        fk: this.envKeysFilepath
      }
      if (this.noArmor) {
        parseOptions.provider = null
      }
      const {
        parsed,
        injected,
        existed
      } = parseSync(env, parseOptions)

      row.privateKeyName = privateKeyName
      row.parsed = parsed
      row.errors = unresolvedEncryptedErrors(parsed, privateKeyName, processEnv)
      row.injected = injected || {}
      row.existed = existed || {}

      this.inject(row.parsed) // inject
    } catch (e) {
      row.errors = [e]
    }

    this.processedEnvs.push(row)
  }

  async _injectEnv (env, privateKeyName = null) {
    const row = {}
    row.type = TYPE_ENV
    row.string = env

    try {
      const processEnv = { ...this.processEnv }
      if (privateKeyName && Object.prototype.hasOwnProperty.call(this.processEnv, privateKeyName)) {
        processEnv[privateKeyName] = this.processEnv[privateKeyName]
      }
      const parseOptions = {
        processEnv,
        overload: this.overload,
        fk: this.envKeysFilepath
      }
      if (this.noArmor) {
        parseOptions.provider = null
      } else {
        parseOptions.provider = (publicKeyHex) => armorProvider(publicKeyHex, {
          onStatus: this.onStatus
        })
      }
      const {
        parsed,
        injected,
        existed
      } = await parse(env, parseOptions)

      row.privateKeyName = privateKeyName
      row.parsed = parsed
      row.errors = unresolvedEncryptedErrors(parsed, privateKeyName, processEnv)
      row.injected = injected || {}
      row.existed = existed || {}

      this.inject(row.parsed) // inject
    } catch (e) {
      row.errors = [e]
    }

    this.processedEnvs.push(row)
  }

  _injectEnvFileSync (envFilepath) {
    const row = {}
    row.type = TYPE_ENV_FILE
    row.filepath = envFilepath

    const filepath = path.resolve(envFilepath)
    try {
      const encoding = detectEncodingSync(filepath)
      const src = fsx.readFileXSync(filepath, { encoding })
      this.readableFilepaths.add(envFilepath)

      const { privateKeyName } = keynames(filepath)
      const parseOptions = { processEnv: this.processEnv, overload: this.overload, fk: this.envKeysFilepath }
      if (this.noArmor) {
        parseOptions.provider = null
      } else {
        parseOptions.provider = armorProviderSync
      }
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
      this.inject(parsed) // inject
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EISDIR') {
        row.errors = [new Errors({ envFilepath, filepath }).missingEnvFile()]
      } else {
        row.errors = [e]
      }
    }

    this.processedEnvs.push(row)
  }

  async _injectEnvFile (envFilepath) {
    const row = {}
    row.type = TYPE_ENV_FILE
    row.filepath = envFilepath

    const filepath = path.resolve(envFilepath)
    try {
      const encoding = await detectEncoding(filepath)
      const src = await fsx.readFileX(filepath, { encoding })
      this.readableFilepaths.add(envFilepath)

      const { privateKeyName } = keynames(filepath)
      const parseOptions = {
        processEnv: this.processEnv,
        overload: this.overload,
        fk: this.envKeysFilepath
      }
      if (this.noArmor) {
        parseOptions.provider = null
      } else {
        parseOptions.provider = (publicKeyHex) => armorProvider(publicKeyHex, {
          onStatus: this.onStatus
        })
      }
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
      this.inject(parsed) // inject
    } catch (e) {
      if (e.code === 'ENOENT' || e.code === 'EISDIR') {
        row.errors = [new Errors({ envFilepath, filepath }).missingEnvFile()]
      } else {
        row.errors = [e]
      }
    }

    this.processedEnvs.push(row)
  }

  inject (parsed) {
    for (const key of Object.keys(parsed)) {
      this.processEnv[key] = parsed[key] // inject to process.env
    }
  }
}

module.exports = Run
