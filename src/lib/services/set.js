const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const parseExpandAndEval = require('./../helpers/parseExpandAndEval')

const ENCODING = 'utf8'

class Set {
  constructor (keyValue, envFile) {
    this.keyValue = keyValue
    this.envFile = envFile

    this.processedEnvFiles = []
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
      const filepath = path.resolve(envFilepath)

      const row = {}
      row.filepath = filepath

      if (fs.existsSync(filepath)) {
        const src = fs.readFileSync(filepath, { encoding: ENCODING })
        const parsed = dotenv.parse(src)

        let keyValueWithNewline = this.keyValue
        if (src.endsWith('\n')) {
          keyValueWithNewline = keyValueWithNewline + '\n'
        } else {
          keyValueWithNewline = '\n' + keyValueWithNewline
        }

        fs.appendFileSync(filepath, keyValueWithNewline)

        row.created = parsed
      } else {
        const code = 'MISSING_ENV_FILE'
        const message = `file does not exist at [${filepath}]`
        const help = `? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx genexample]`

        const error = new Error(message)
        error.code = code
        error.help = help

        row.error = error
      }

      this.processedEnvFiles.push(row)
    }

    return {
      processedEnvFile: this.processedEnvFiles
    }
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Set
