const fsx = require('./../helpers/fsx')
const path = require('path')
const picomatch = require('picomatch')

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
  isEncrypted,
  isPublicKey,
  provision,
  mutateSrc
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const dotenvParse = require('./../helpers/dotenvParse')
const detectEncoding = require('./../helpers/detectEncoding')

class Encrypt {
  constructor (envs = [], key = [], excludeKey = [], envKeysFilepath = null, opsOn = false) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.excludeKey = excludeKey
    this.envKeysFilepath = envKeysFilepath
    this.opsOn = opsOn

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  run () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    this.keys = this._keys()
    const excludeKeys = this._excludeKeys()

    this.exclude = picomatch(excludeKeys)
    this.include = picomatch(this.keys, { ignore: excludeKeys })

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._encryptEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _encryptEnvFile (envFilepath) {
    const row = {}
    row.keys = []
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath

    try {
      const encoding = this._detectEncoding(filepath)
      let envSrc = fsx.readFileX(filepath, { encoding })
      const envParsed = dotenvParse(envSrc)

      let publicKey
      let privateKey

      const { publicKeyName, privateKeyName } = keyNames(envFilepath)
      const { publicKeyValue, privateKeyValue } = keyValues(envFilepath, { keysFilepath: this.envKeysFilepath, opsOn: this.opsOn })

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

        this.validatePairedPrivateKey({ publicKeyValue, publicKey })

        // scenario when encrypting a monorepo second .env file from a prior generated -fk .env.keys file
        if (!publicKeyValue) {
          envSrc = mutateSrc({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, publicKeyName, publicKeyValue: publicKey })
        }
      } else if (publicKeyValue) {
        publicKey = publicKeyValue
      }

      row.publicKey = publicKey
      row.privateKey = privateKey
      row.privateKeyName = privateKeyName

      // iterate over all non-encrypted values and encrypt them
      for (const [key, value] of Object.entries(envParsed)) {
        // key excluded - don't encrypt it
        if (this.exclude(key)) {
          continue
        }

        // key effectively excluded (by not being in the list of includes) - don't encrypt it
        if (this.keys.length > 0 && !this.include(key)) {
          continue
        }

        const encrypted = isEncrypted(value) || isPublicKey(key)
        if (!encrypted) {
          row.keys.push(key) // track key(s)

          const encryptedValue = encryptValue(value, publicKey)

          // once newSrc is built write it out
          envSrc = replace(envSrc, key, encryptedValue)

          row.changed = true // track change
        }
      }

      row.envSrc = envSrc
      if (row.changed) {
        this.changedFilepaths.add(envFilepath)
      } else {
        this.unchangedFilepaths.add(envFilepath)
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

  _keys () {
    if (!Array.isArray(this.key)) {
      return [this.key]
    }

    return this.key
  }

  _excludeKeys () {
    if (!Array.isArray(this.excludeKey)) {
      return [this.excludeKey]
    }

    return this.excludeKey
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

module.exports = Encrypt
