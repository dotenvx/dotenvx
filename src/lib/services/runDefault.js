const fs = require('fs')
const path = require('path')

const ENCODING = 'utf8'
const DEFAULT_ENVS = [{ type: 'envFile', value: '.env' }]

const inject = require('./../helpers/inject')
const parseExpandAndEval = require('./../helpers/parseExpandAndEval')


class RunDefault {
  constructor (envs = [], overload = false) {
    if (!envs || envs.length <= 0) {
      this.envs = DEFAULT_ENVS // default to .env file expectation
    } else {
      this.envs = envs
    }
    this.overload = overload

    this.strings = []
    this.files = []
    this.readableFilepaths = new Set()
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
      if (env.type === 'env') {
        this._injectEnv(env.value)
      } else if (env.type === 'envFile') {
        this._injectEnvFile(env.value)
      }
    }

    return {
      files: this.files,
      strings: this.strings,
      readableFilepaths: [...this.readableFilepaths],
      uniqueInjectedKeys: [...this.uniqueInjectedKeys]
    }
  }

  _injectEnv(env) {
    const row = {}
    row.string = env

    try {
      const parsed = parseExpandAndEval(env, this.overload)
      row.parsed = parsed

      const { injected, preExisted } = this._inject(process.env, parsed, this.overload)
      row.injected = injected
      row.preExisted = preExisted

      for (const key of Object.keys(injected)) {
        this.uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
      }
    } catch (e) {
      row.error = e
    }

    this.strings.push(row)
  }

  _injectEnvFile(envFilepath) {
    const row = {}
    row.filepath = envFilepath

    const filepath = path.resolve(envFilepath)
    try {
      const src = fs.readFileSync(filepath, { encoding: ENCODING })
      this.readableFilepaths.add(envFilepath)

      const parsed = parseExpandAndEval(src, this.overload)
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

    this.files.push(row)
  }

  _inject(processEnv, parsed, overload) {
    return inject(processEnv, parsed, overload)
  }
}

module.exports = RunDefault
