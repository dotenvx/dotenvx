const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

const ENCODING = 'utf8'

class RunDefault {
  constructor (envFile, overload) {
    this.envFile = envFile
    this.overload = overload
  }

  run () {
    const files = []
    const readableFilepaths = new Set()
    const uniqueInjectedKeys = new Set()

    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const row = {}
      row['filepath'] = envFilepath

      const filepath = path.resolve(envFilepath)
      try {
        const src = fs.readFileSync(filepath, { encoding: ENCODING })
        readableFilepaths.add(envFilepath)

        const parsed = this._parseExpand(src)
        row['parsed'] = parsed

        const { injected, preExisted } = this._inject(process.env, parsed)
        row['injected'] = injected
        row['preExisted'] = preExisted

        for (const key of Object.keys(injected)) {
          uniqueInjectedKeys.add(key) // track uniqueInjectedKeys across multiple files
        }
      } catch (e) {
        if (e.code === 'ENOENT') {
          const error = new Error(`missing ${envFilepath} file (${filepath})`)
          error.code = 'MISSING_ENV_FILE'

          row['error'] = error
        } else {
          row['error'] = e
        }
      }

      files.push(row)
    }

    return {
      files: files,
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

  _parseExpand (src) {
    const parsed = dotenv.parse(src)

    // consider moving this logic straight into dotenv-expand
    let inputParsed = {}
    if (this.overload) {
      inputParsed = { ...process.env, ...parsed }
    } else {
      inputParsed = { ...parsed, ...process.env }
    }

    const expandPlease = {
      processEnv: {},
      parsed: inputParsed
    }
    const expanded = dotenvExpand.expand(expandPlease).parsed

    // but then for logging only log the original keys existing in parsed. this feels unnecessarily complex - like dotenv-expand should support the ability to inject additional `process.env` or objects as it sees fit to the object it wants to expand
    const result = {}
    for (const key in parsed) {
      result[key] = expanded[key]
    }

    return result
  }

  _inject (processEnv = {}, parsed = {}) {
    const injected = {}
    const preExisted = {}

    // set processEnv
    for (const key of Object.keys(parsed)) {
      if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
        if (this.overload === true) {
          processEnv[key] = parsed[key]

          injected[key] = parsed[key] // track injected key/value
        } else {
          preExisted[key] = processEnv[key] // track preExisted key/value
        }
      } else {
        processEnv[key] = parsed[key]
        injected[key] = parsed[key] // track injected key/value
      }
    }

    return {
      injected,
      preExisted
    }
  }
}

module.exports = RunDefault
