const fs = require('fs')
const path = require('path')

const ENCODING = 'utf8'

class Sets {
  constructor (key, value, envFile) {
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
        const src = fs.readFileSync(filepath, { encoding: ENCODING })

        let keyValueWithNewline = `${this.key}="${this.value}"`
        if (src.endsWith('\n')) {
          keyValueWithNewline = keyValueWithNewline + '\n'
        } else {
          keyValueWithNewline = '\n' + keyValueWithNewline
        }

        fs.appendFileSync(filepath, keyValueWithNewline)
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

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Sets
