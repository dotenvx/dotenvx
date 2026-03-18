const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')

const {
  determine
} = require('./../helpers/envResolution')

const {
  keyNames,
  keyValues
} = require('./../helpers/keyResolution')

const {
  deriveKeypair,
  encryptValue,
  decryptKeyValue,
  isEncrypted,
  provision
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const truncate = require('./../helpers/truncate')
const dotenvParse = require('./../helpers/dotenvParse')
const detectEncoding = require('./../helpers/detectEncoding')
const preserveShebang = require('./../helpers/preserveShebang')
const prependPublicKey = require('./../helpers/prependPublicKey')

class Sets {
  constructor (key, value, envs = [], encrypt = true, envKeysFilepath = null, opsOn = false) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.value = value
    this.encrypt = encrypt
    this.envKeysFilepath = envKeysFilepath
    this.opsOn = opsOn

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
    row.key = this.key || null
    row.value = this.value || null
    row.type = TYPE_ENV_FILE

    const filename = path.basename(envFilepath)
    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath
    row.changed = false

    try {
      const encoding = this._detectEncoding(filepath)
      let envSrc = fsx.readFileX(filepath, { encoding })
      const envParsed = dotenvParse(envSrc)
      row.originalValue = envParsed[row.key] || null
      const wasPlainText = !isEncrypted(row.originalValue)
      this.readableFilepaths.add(envFilepath)

      if (this.encrypt) {
        let publicKey
        let privateKey

        const { publicKeyName, privateKeyName } = keyNames(filepath)
        const { publicKeyValue, privateKeyValue } = keyValues(filepath, { keysFilepath: this.envKeysFilepath, opsOn: this.opsOn })

        // first pass - provision
        if (!privateKeyValue && !publicKeyValue) {
          // creates .env.keys file (or ops)
          const firstTime = provision({
            envSrc,
            envFilepath,
            keysFilepath: this.envKeysFilepath
          })

          envSrc = firstTime.envSrc
          publicKey = firstTime.publicKey
          privateKey = firstTime.privateKey
          row.privateKeyAdded = firstTime.privateKeyAdded
          row.envKeysFilepath = firstTime.envKeysFilepath
        } else if (privateKeyValue) {
          const kp = deriveKeypair(privateKeyValue)
          publicKey = kp.publicKey
          privateKey = kp.privateKey

          if (row.originalValue) {
            row.originalValue = decryptKeyValue(row.key, row.originalValue, privateKeyName, privateKey)
          }

          this.validatePairedPrivateKey({ publicKeyValue, publicKey })

          // typical scenario when encrypting a monorepo second .env file from a prior generated -fk .env.keys file
          if (!publicKeyValue) {
            const ps = preserveShebang(envSrc)
            const firstLinePreserved = ps.firstLinePreserved
            envSrc = ps.envSrc

            let envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
            if (this.envKeysFilepath) {
              envKeysFilepath = path.resolve(this.envKeysFilepath)
            }
            const relativeFilepath = path.relative(path.dirname(filepath), envKeysFilepath)
            const prependedPublicKey = prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)

            envSrc = `${firstLinePreserved}${prependedPublicKey}\n${envSrc}`
          }
        } else if (publicKeyValue) {
          // handle existing publicKeyValue - good enough for sets since only need public key
          publicKey = publicKeyValue
        }

        row.publicKey = publicKey
        row.privateKey = privateKey
        row.encryptedValue = encryptValue(this.value, publicKey)
        row.privateKeyName = privateKeyName
      }

      const goingFromPlainTextToEncrypted = wasPlainText && this.encrypt
      const valueChanged = this.value !== row.originalValue
      if (goingFromPlainTextToEncrypted || valueChanged) {
        row.envSrc = replace(envSrc, this.key, row.encryptedValue || this.value)
        this.changedFilepaths.add(envFilepath)
        row.changed = true
      } else {
        row.envSrc = envSrc
        this.unchangedFilepaths.add(envFilepath)
        row.changed = false
      }
    } catch (e) {
      if (e.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = e
      }
    }

    this.processedEnvs.push(row)
  }

  validatePairedPrivateKey ({ publicKeyValue, publicKey }) {
    // if derivation doesn't match what's in the file (or preset in env)
    if (publicKeyValue && publicKeyValue !== publicKey) {
      throw new Errors({ publicKey, publicKeyExisting: publicKeyValue }).mispairedPrivateKey()
    }
  }

  _detectEncoding (filepath) {
    return detectEncoding(filepath)
  }
}

module.exports = Sets
