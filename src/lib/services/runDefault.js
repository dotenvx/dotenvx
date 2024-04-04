const fs = require('fs')
const path = require('path')

const ENCODING = 'utf8'
const TYPE_ENV = 'env'
const TYPE_ENV_FILE = 'envFile'
const DEFAULT_ENVS = [{ type: TYPE_ENV_FILE, value: '.env' }]

const inject = require('./../helpers/inject')
const parseExpandAndEval = require('./../helpers/parseExpandAndEval')

class RunDefault {
  constructor (envs = [], overload = false) {
    this.envs = this._determineEnvs(envs)
    this.overload = overload

    this.processedEnvs = []
    this.readableFilepaths = new Set()
    this.readableStrings = new Set()
    this.uniqueInjectedKeys = new Set()
  }

  run () {
    // example
    // envs [
    //   { type: 'env', value: 'HELLO=one' },
    //   { type: 'envFile', value: '.env' },
    //   { type: 'env', value: 'HELLO=three' }
    // ]
    for (const env of this.envs) {
      if (env.type === TYPE_ENV) {
        this._injectEnv(env.value)
      } else if (env.type === TYPE_ENV_FILE) {
        this._injectEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      readableStrings: [...this.readableStrings],
      readableFilepaths: [...this.readableFilepaths],
      uniqueInjectedKeys: [...this.uniqueInjectedKeys]
    }
  }

  _injectEnv (env) {
    const row = {}
    row.type = TYPE_ENV
    row.string = env

    try {
      const parsed = parseExpandAndEval(env)
      row.parsed = parsed
      this.readableStrings.add(env)

      const { injected, preExisted } = this._inject(process.env, parsed, this.overload)
      row.injected = injected
      row.preExisted = preExisted

      for (const key of Object.keys(injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
    } catch (e) {
      row.error = e
    }

    this.processedEnvs.push(row)
  }

  _injectEnvFile (envFilepath) {
    const row = {}
    row.type = TYPE_ENV_FILE
    row.filepath = envFilepath

    const filepath = path.resolve(envFilepath)
    try {
      const src = fs.readFileSync(filepath, { encoding: ENCODING })
      this.readableFilepaths.add(envFilepath)

      const parsed = parseExpandAndEval(src)
      row.parsed = parsed

      const { injected, preExisted } = this._inject(process.env, parsed, this.overload)
      row.injected = injected
      row.preExisted = preExisted

      for (const key of Object.keys(injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        const error = new Error(`missing ${envFilepath} file (${filepath})`)
        error.code = 'MISSING_ENV_FILE'

        row.error = error
      } else {
        row.error = e
      }
    }

    this.processedEnvs.push(row)
  }

  _inject (processEnv, parsed, overload) {
    return inject(processEnv, parsed, overload)
  }

  _determineEnvs (envs = []) {
    if (!envs || envs.length <= 0) {
      return DEFAULT_ENVS // default to .env file expectation
    } else {
      let hasAtLeastOneEnvFile = false

      for (const env of envs) {
        if (env.type === TYPE_ENV_FILE) {
          hasAtLeastOneEnvFile = true
        }
      }

      if (hasAtLeastOneEnvFile) {
        return envs
      } else {
        return [...DEFAULT_ENVS, ...envs]
      }
    }
  }
}

module.exports = RunDefault
