const fs = require('fs')
const path = require('path')

const ENCODING = 'utf8'

const inject = require('./../helpers/inject')
const parseExpandAndEval = require('./../helpers/parseExpandAndEval')

class RunDefault {
  constructor (envFile = '.env', env = [], overload = false) {
    this.envFile = envFile
    this.env = env
    this.overload = overload
  }

  run () {
    const strings = []
    const files = []
    const readableFilepaths = new Set()
    const uniqueInjectedKeys = new Set()

    const envs = this._envs()
    for (const env of envs) {
      const row = {}
      row.string = env

      try {
        const parsed = parseExpandAndEval(env, this.overload)
        row.parsed = parsed

        const { injected, preExisted } = inject(process.env, parsed, this.overload)
        row.injected = injected
        row.preExisted = preExisted

        for (const key of Object.keys(injected)) {
          uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
        }
      } catch (e) {
        row.error = e
      }

      strings.push(row)
    }

    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const row = {}
      row.filepath = envFilepath

      const filepath = path.resolve(envFilepath)
      try {
        const src = fs.readFileSync(filepath, { encoding: ENCODING })
        readableFilepaths.add(envFilepath)

        const parsed = parseExpandAndEval(src, this.overload)
        row.parsed = parsed

        const { injected, preExisted } = inject(process.env, parsed, this.overload)
        row.injected = injected
        row.preExisted = preExisted

        for (const key of Object.keys(injected)) {
          uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
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

      files.push(row)
    }

    return {
      files,
      strings,
      readableFilepaths: [...readableFilepaths], // array
      uniqueInjectedKeys: [...uniqueInjectedKeys]
    }
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }

  _envs () {
    if (!Array.isArray(this.env)) {
      return [this.env]
    }

    return this.env
  }
}

module.exports = RunDefault
