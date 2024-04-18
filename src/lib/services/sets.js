const fs = require('fs')
const path = require('path')

const ENCODING = 'utf8'

class Sets {
  constructor (key, value, envFile = '.env') {
    this.key = key
    this.value = value
    this.envFile = envFile

    this.processedEnvFiles = []
    this.settableFilepaths = new Set()
  }

  run () {
    if (this.envFile.length < 1) {
      const code = 'MISSING_ENV_FILES'
      const message = 'no .env* files found'
      const help = '? add one with [echo "HELLO=World" > .env] and then run [dotenvx genexample]'

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const row = {}
      row.key = this.key
      row.value = this.value
      row.filepath = envFilepath

      const filepath = path.resolve(envFilepath)
      try {
        const formatted = this._keyValueFormatted(filepath)
        fs.appendFileSync(filepath, formatted)

        this.settableFilepaths.add(envFilepath)
      } catch (e) {
        if (e.code === 'ENOENT') {
          const error = new Error(`missing ${envFilepath} file (${filepath})`)
          error.code = 'MISSING_ENV_FILE'

          row.error = error
        } else {
          row.error = e
        }
      }

      this.processedEnvFiles.push(row)
    }

    return {
      processedEnvFiles: this.processedEnvFiles,
      settableFilepaths: [...this.settableFilepaths]
    }
  }

  _keyValueFormatted (filepath) {
    const src = fs.readFileSync(filepath, { encoding: ENCODING })

    let formatted = `${this.key}="${this.value}"`
    if (src.endsWith('\n')) {
      formatted = formatted + '\n'
    } else {
      formatted = '\n' + formatted
    }

    return formatted
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Sets
