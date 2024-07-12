const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const encryptValue = require('./../helpers/encryptValue')
const isEncrypted = require('./../helpers/isEncrypted')
const isPublicKey = require('./../helpers/isPublicKey')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Encrypt {
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
        // get the original src
        let src = fs.readFileSync(filepath, { encoding: ENCODING })
        // get/generate the public key
        const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
        const {
          envSrc,
          keysSrc,
          publicKey,
          privateKey,
          publicKeyAdded,
          privateKeyAdded
        } = findOrCreatePublicKey(filepath, envKeysFilepath)

        // handle .env.keys write
        fs.writeFileSync(envKeysFilepath, keysSrc)

        src = envSrc // src was potentially modified by findOrCreatePublicKey so we set it again here

        row.changed = publicKeyAdded // track change
        row.publicKey = publicKey
        row.privateKey = privateKey
        row.privateKeyAdded = privateKeyAdded
        row.privateKeyName = guessPrivateKeyName(filepath)

        // iterate over all non-encrypted values and encrypt them
        const parsed = dotenv.parse(src)
        for (const [key, value] of Object.entries(parsed)) {
          if (keys.length < 1 || keys.includes(key)) {
            // optionally control which key to encrypt
            const encrypted =
              isEncrypted(key, value) || isPublicKey(key, value)
            if (!encrypted) {
              row.keys.push(key) // track key(s)

              const encryptedValue = encryptValue(value, publicKey)
              // once newSrc is built write it out
              src = replace(src, key, encryptedValue)

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

module.exports = Encrypt
