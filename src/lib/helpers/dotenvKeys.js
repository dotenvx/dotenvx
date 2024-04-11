const crypto = require('crypto')

const guessEnvironment = require('./guessEnvironment')

class DotenvKeys {
  constructor (envFilepaths = [], dotenvKeys = {}) {
    this.envFilepaths = envFilepaths // pass .env* filepaths to be encrypted
    this.dotenvKeys = dotenvKeys // pass current parsed dotenv keys from .env.keys file
  }

  run () {
    const addedKeys = new Set()
    const existingKeys = new Set()

    for (const filepath of this.envFilepaths) {
      const environment = guessEnvironment(filepath)
      const key = `DOTENV_KEY_${environment.toUpperCase()}`

      let value = this.dotenvKeys[key]

      // first time seeing new DOTENV_KEY_${environment}
      if (!value || value.length === 0) {
        value = this._generateDotenvKey(environment)

        this.dotenvKeys[key] = value

        addedKeys.add(key) // for info logging to user
      } else {
        existingKeys.add(key) // for info logging to user
      }
    }

    let keysData = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/\n`

    for (const [key, value] of Object.entries(this.dotenvKeys)) {
      keysData += `${key}="${value}"\n`
    }

    return {
      dotenvKeys: this.dotenvKeys,
      dotenvKeysFile: keysData,
      addedKeys: [...addedKeys], // return set as array
      existingKeys: [...existingKeys] // return set as array
    }
  }

  _generateDotenvKey (environment) {
    const rand = crypto.randomBytes(32).toString('hex')

    return `dotenv://:key_${rand}@dotenvx.com/vault/.env.vault?environment=${environment.toLowerCase()}`
  }
}

module.exports = DotenvKeys
