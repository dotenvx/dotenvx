const fsx = require('./../helpers/fsx')
const path = require('path')
const dotenv = require('dotenv')

const TYPE_ENV_FILE = 'envFile'

const findOrCreatePublicKey = require('./../helpers/findOrCreatePublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const encryptValue = require('./../helpers/encryptValue')
const replace = require('./../helpers/replace')
const detectEncoding = require('./../helpers/detectEncoding')
// const findPrivateKey = require('./../helpers/findPrivateKey')
const determineEnvs = require('./../helpers/determineEnvs')

class Sets {
  constructor (key, value, envs = [], encrypt = true) {
    this.envs = determineEnvs(envs, process.env)
    this.key = key
    this.value = value
    // this.envFile = envFile
    this.encrypt = encrypt

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
    this.readableFilepaths = new Set()
  }

  run () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._setEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _setEnvFile (envFilepath) {
    const row = {}
    row.key = this.key
    row.value = this.value
    row.type = TYPE_ENV_FILE
    row.filepath = envFilepath
    row.changed = false

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath

    try {
      const encoding = this._detectEncoding(filepath)
      let src = fsx.readFileX(filepath, { encoding })
      this.readableFilepaths.add(envFilepath)

      // const privateKey = findPrivateKey(envFilepath) // TODO: use this instead of what is coming back from findOrCreatePublicKey

      let value = this.value
      row.originalValue = dotenv.parse(src)[row.key] || null

      if (this.encrypt) {
        // why? NOT NECESSARY if DOTENV_PRIVATE_KEY already set
        const envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
        const {
          envSrc,
          keysSrc,
          publicKey,
          privateKey,
          publicKeyAdded,
          privateKeyAdded
        } = findOrCreatePublicKey(filepath, envKeysFilepath)

        // why? NOT NECESSARY if DOTENV_PRIVATE_KEY already set
        // handle .env.keys write
        fsx.writeFileX(envKeysFilepath, keysSrc)

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

    this.processedEnvs.push(row)
  }

  _detectEncoding (filepath) {
    return detectEncoding(filepath)
  }
}

module.exports = Sets
