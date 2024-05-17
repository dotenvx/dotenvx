const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const encryptValue = require('./../helpers/encryptValue')
const isEncrypted = require('./../helpers/isEncrypted')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Encrypt {
  constructor (envFile = '.env') {
    this.envFile = envFile
    this.processedEnvFiles = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  run () {
    const envFilepaths = this._envFilepaths()
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
          publicKey,
          privateKey,
          privateKeyAdded
        } = findOrCreatePublicKey(filepath, envKeysFilepath)
        row.publicKey = publicKey
        row.privateKey = privateKey
        row.privateKeyName = guessPrivateKeyName(filepath)
        row.privateKeyAdded = privateKeyAdded

        // src was potentially changed by findOrCreatePublicKey so we set it again here
        src = envSrc

        // track possible changes
        let changed = false

        // iterate over all non-encrypted values and encrypt them
        const parsed = dotenv.parse(src)
        for (const [key, value] of Object.entries(parsed)) {
          const encrypted = isEncrypted(key, value)
          if (!encrypted) {
            const encryptedValue = encryptValue(value, publicKey)
            // once newSrc is built write it out
            src = replace(src, key, encryptedValue)

            // add key
            row.keys.push(key)

            // track change
            changed = true
          }
        }

        if (changed) {
          row.envSrc = src
          row.changed = true
          this.changedFilepaths.add(envFilepath)
        } else {
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
}

module.exports = Encrypt
