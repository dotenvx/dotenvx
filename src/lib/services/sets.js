const fs = require('fs')
const path = require('path')

const dotenv = require('dotenv')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const encryptValue = require('./../helpers/encryptValue')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Sets {
  constructor (key, value, envFile = '.env', encrypt = true) {
    this.key = key
    this.value = value
    this.envFile = envFile
    this.encrypt = encrypt

    this.processedEnvFiles = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  run () {
    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const filepath = path.resolve(envFilepath)

      const row = {}
      row.key = this.key
      row.value = this.value
      row.filepath = filepath
      row.envFilepath = envFilepath
      row.changed = false

      try {
        let value = this.value
        let src = fs.readFileSync(filepath, { encoding: ENCODING })
        row.originalValue = dotenv.parse(src)[row.key] || null

        if (this.encrypt) {
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

          value = encryptValue(value, publicKey)

          row.changed = publicKeyAdded // track change
          row.encryptedValue = value
          row.publicKey = publicKey
          row.privateKey = privateKey
          row.privateKeyAdded = privateKeyAdded
          row.privateKeyName = guessPrivateKeyName(filepath)
        }

        if (value !== row.originalValue) {
          row.envSrc = replace(src, this.key, value)

          this.changedFilepaths.add(envFilepath)
          row.changed = true
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
}

module.exports = Sets
