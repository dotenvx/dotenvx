const fs = require('fs')
const path = require('path')

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const encryptValue = require('./../helpers/encryptValue')
const replace = require('./../helpers/replace')

const ENCODING = 'utf8'

class Sets {
  constructor (key, value, envFile = '.env', encrypt = false) {
    this.key = key
    this.value = value
    this.envFile = envFile
    this.encrypt = encrypt

    this.publicKey = null
    this.processedEnvFiles = []
    this.settableFilepaths = new Set()
  }

  run () {
    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      const row = {}
      row.key = this.key
      row.filepath = envFilepath
      row.value = this.value

      const filepath = path.resolve(envFilepath)
      try {
        let value = this.value
        if (this.encrypt) {
          const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
          const { publicKey } = findOrCreatePublicKey(filepath, envKeysFilepath)
          value = encryptValue(value, publicKey)
        }

        const src = fs.readFileSync(filepath, { encoding: ENCODING })
        const newSrc = replace(src, this.key, value)

        fs.writeFileSync(filepath, newSrc)

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
