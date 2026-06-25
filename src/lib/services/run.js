const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV = 'env'
const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const detectEncoding = require('./../helpers/detectEncoding')
const detectEncodingSync = require('./../helpers/detectEncodingSync')
const { parse: parseprim } = require('@dotenvx/primitives')
const armorProvider = require('./../providers/armor/index')
const keynames = require('./../conventions/keynames')

function encryptedValue (value) {
  return typeof value === 'string' && value.startsWith('encrypted:')
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
    this.uniqueInjectedKeys = new Set()
    this.beforeEnv = { ...this.processEnv }
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
      readableFilepaths: [...this.readableFilepaths],
      uniqueInjectedKeys: [...this.uniqueInjectedKeys],
      beforeEnv: this.beforeEnv,
      afterEnv: { ...this.processEnv }
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
      readableFilepaths: [...this.readableFilepaths],
      uniqueInjectedKeys: [...this.uniqueInjectedKeys],
      beforeEnv: this.beforeEnv,
      afterEnv: { ...this.processEnv }
    }
  }

  _injectEnvSync (env, privateKeyName = null) {
    const row = {}
    row.type = TYPE_ENV
    row.string = env

    try {
      const Parse = require('./../helpers/parse')
      const {
        keyValuesFromEnvSrc
      } = require('./../helpers/keyResolution')
      const {
        privateKeyName: resolvedPrivateKeyName,
        privateKeyValue
      } = keyValuesFromEnvSrc(env, privateKeyName, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        processEnv: this.processEnv,
        token: this.token,
        command: this.command
      })

      const {
        parsed,
        errors,
        injected,
        existed
      } = new Parse(env, privateKeyValue, this.processEnv, this.overload, resolvedPrivateKeyName).run()

      row.privateKeyName = resolvedPrivateKeyName
      row.parsed = parsed
      row.errors = errors
      row.injected = injected
      row.existed = existed

      this.inject(row.parsed) // inject

      for (const key of Object.keys(injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
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
      const {
        parsed,
        injected,
        existed
      } = await parseprim(env, {
        processEnv,
        overload: this.overload,
        fk: this.envKeysFilepath,
        provider: this.noArmor
          ? null
          : (publicKeyHex) => armorProvider(publicKeyHex, {
              onStatus: this.onStatus
            })
      })

      row.privateKeyName = privateKeyName
      row.parsed = parsed
      row.errors = []
      if (privateKeyName && !processEnv[privateKeyName]) {
        for (const [key, value] of Object.entries(parsed)) {
          if (encryptedValue(value)) {
            row.errors.push(new Errors({ key, privateKeyName, privateKey: null }).missingPrivateKey())
          }
        }
      }
      row.injected = injected || {}
      row.existed = existed || {}

      this.inject(row.parsed) // inject

      for (const key of Object.keys(row.injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
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
      }
      const parseconv = require('./../conventions/parse')
      const {
        parsed,
        errors,
        injected,
        existed
      } = parseconv(src, parseOptions)
      row.privateKeyName = privateKeyName
      row.src = src
      row.parsed = parsed
      row.injected = injected || {}
      row.errors = errors || []
      row.existed = existed || {}
      this.inject(parsed) // inject
      for (const key of Object.keys(row.injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
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
        fk: this.envKeysFilepath,
        provider: this.noArmor
          ? null
          : (publicKeyHex) => armorProvider(publicKeyHex, {
              onStatus: this.onStatus
            })
      }
      const {
        parsed,
        errors,
        injected,
        existed
      } = await parseprim(src, parseOptions)
      row.privateKeyName = privateKeyName
      row.src = src
      row.parsed = parsed
      row.injected = injected || {}
      row.errors = errors || []
      row.existed = existed || {}
      this.inject(parsed) // inject
      for (const key of Object.keys(row.injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
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
