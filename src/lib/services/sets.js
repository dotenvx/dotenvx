const fs = require('fs')
const path = require('path')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const encryptValue = require('./../helpers/encryptValue')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Sets {
  constructor (key, value, envFile = '.env', encrypt = false) {
    this.key = key
    this.value = value
    this.envFile = envFile
    this.encrypt = encrypt

    this.processedEnvFiles = []
    this.changedFilepaths = new Set()
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

      try {
        let value = this.value
        let src = fs.readFileSync(filepath, { encoding: ENCODING })
        if (this.encrypt) {
          const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
          const {
            envSrc,
            publicKey,
            privateKey,
            privateKeyAdded,
          } = findOrCreatePublicKey(filepath, envKeysFilepath)
          src = envSrc // overwrite the original read (because findOrCreatePublicKey) rewrite to it
          value = encryptValue(value, publicKey)
          row.encryptedValue = value // useful
          row.publicKey = publicKey
          row.privateKey = privateKey
          row.privateKeyAdded = privateKeyAdded
          row.privateKeyName = guessPrivateKeyName(filepath)
        }

        const newSrc = replace(src, this.key, value)
        row.envSrc = newSrc

        this.changedFilepaths.add(envFilepath)
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
      changedFilepaths: [...this.changedFilepaths]
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
