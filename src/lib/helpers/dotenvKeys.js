const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const { configDotenv } = require('./../main')

class DotenvKeys {
  constructor (directory = '.') {
    this.directory = directory
    this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
    this.envFilepaths = ['.env'] // implement
  }

  run () {
    const addedKeys = new Set()
    const existingKeys = new Set()
    const dotenvKeys = this._parsedDotenvKeys()

    for (const envFilepath of this.envFilepaths) {
      const filepath = path.resolve(this.directory, envFilepath)

      if (!fs.existsSync(filepath)) {
        const code = 'DOTENV_FILE_DOES_NOT_EXIST'
        const message = `file does not exist at [${filepath}]`
        const help = `? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx encrypt]`

        const error = new Error(message)
        error.code = code
        error.help = help

        throw error
      }

      const environment = this._guessEnvironment(filepath)
      const key = `DOTENV_KEY_${environment.toUpperCase()}`

      let value = dotenvKeys[key]

      // first time seeing new DOTENV_KEY_${environment}
      if (!value || value.length === 0) {
        value = this._generateDotenvKey(environment)

        dotenvKeys[key] = value

        addedKeys.add(key) // for info logging to user
      } else {
        existingKeys.add(key) // for info logging to user
      }
    }

    let keysData = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/\n`

    for (const key in dotenvKeys) {
      const value = dotenvKeys[key]
      keysData += `${key}="${value}"\n`
    }

    return {
      envKeys: keysData, // return set as array
      addedKeys: [...addedKeys], // return set as array
      existingKeys: [...existingKeys]
    }
  }

  _parsedDotenvKeys () {
    const options = {
      path: this.envKeysFilepath
    }

    return configDotenv(options).parsed || {}
  }

  _guessEnvironment (filepath) {
    const filename = path.basename(filepath)
    const parts = filename.split('.')
    const possibleEnvironment = parts[2] // ['', 'env', environment', 'previous']

    if (!possibleEnvironment || possibleEnvironment.length === 0) {
      return 'development'
    }

    return possibleEnvironment
  }

  _generateDotenvKey (environment) {
    const rand = crypto.randomBytes(32).toString('hex')

    return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment.toLowerCase()}`
  }
}

module.exports = DotenvKeys
