const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const encryptValue = require('./../helpers/encryptValue')
const isEncrypted = require('./../helpers/isEncrypted')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Encryptme {
  constructor (envFile = '.env') {
    this.envFile = envFile
    this.publicKey = null
    this.processedEnvFiles = []
    this.settableFilepaths = new Set()
  }

  run () {
    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const row = {}
      row.keys = []
      row.filepath = envFilepath

      const filepath = path.resolve(envFilepath)
      try {
        // get the original src
        let src = fs.readFileSync(filepath, { encoding: ENCODING })
        // get/generate the public key
        const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
        const {
          publicKey,
          envSrc
        } = findOrCreatePublicKey(filepath, envKeysFilepath)
        src = envSrc // src was potentially changed by findOrCreatePublicKey

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
          fs.writeFileSync(filepath, src)
        }

        row.publicKey = publicKey
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

module.exports = Encryptme
