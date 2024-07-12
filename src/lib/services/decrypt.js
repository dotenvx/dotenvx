const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const smartDotenvPrivateKey = require('./../helpers/smartDotenvPrivateKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const decryptValue = require('./../helpers/decryptValue')
const isEncrypted = require('./../helpers/isEncrypted')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Decrypt {
  /**
   * @param {string|string[]} [envFile]
   * @param {string|string[]} [key]
   **/
  constructor (envFile = '.env', key = []) {
    this.envFile = envFile
    this.key = key
    this.processedEnvFiles = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  run () {
    const envFilepaths = this._envFilepaths()
    const keys = this._keys()
    for (const envFilepath of envFilepaths) {
      const filepath = path.resolve(envFilepath)

      const row = {}
      row.keys = []
      row.filepath = filepath
      row.envFilepath = envFilepath

      try {
        // get the src
        let src = fs.readFileSync(filepath, { encoding: ENCODING })

        // if DOTENV_PRIVATE_KEY_* already set in process.env then use it
        const privateKey = smartDotenvPrivateKey(envFilepath)
        row.privateKey = privateKey
        row.privateKeyName = guessPrivateKeyName(filepath)

        // track possible changes
        row.changed = false

        // iterate over all non-encrypted values and encrypt them
        const parsed = dotenv.parse(src)
        for (const [key, value] of Object.entries(parsed)) {
          if (keys.length < 1 || keys.includes(key)) { // optionally control which key to decrypt
            const encrypted = isEncrypted(key, value)
            if (encrypted) {
              row.keys.push(key) // track key(s)

              const plainValue = decryptValue(value, privateKey)
              // once newSrc is built write it out
              src = replace(src, key, plainValue)

              row.changed = true // track change
            }
          }
        }

        if (row.changed) {
          row.envSrc = src
          this.changedFilepaths.add(envFilepath)
        } else {
          row.envSrc = src
          this.unchangedFilepaths.add(envFilepath)
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

      this.processedEnvFiles.push(row)
    }

    return {
      processedEnvFiles: this.processedEnvFiles,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }

  _keys () {
    if (!Array.isArray(this.key)) {
      return [this.key]
    }

    return this.key
  }
}

module.exports = Decrypt
