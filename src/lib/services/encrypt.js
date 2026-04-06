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
  encryptValue,
  isEncrypted,
  isPublicKey,
  provision,
  provisionWithPrivateKey
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const dotenvParse = require('./../helpers/dotenvParse')
const detectEncoding = require('./../helpers/detectEncoding')
const SAMPLE_ENV_KIT = require('./../helpers/kits/sample')

class Encrypt {
  constructor (envs = [], key = [], excludeKey = [], envKeysFilepath = null, noOps = false, noCreate = false) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.excludeKey = excludeKey
    this.envKeysFilepath = envKeysFilepath
    this.noOps = noOps
    this.noCreate = noCreate

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
  }

  async run () {
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
        await this._encryptEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  async _encryptEnvFile (envFilepath) {
    const row = {}
    row.keys = []
    row.type = TYPE_ENV_FILE
    let fileCreated = false

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath

    try {
      // if noCreate is on then detectEncoding will throw and we'll halt the calls
      // but if noCreate is false then create the file if it doesn't exist
      if (!(await fsx.exists(filepath)) && !this.noCreate) {
        await fsx.writeFileX(filepath, SAMPLE_ENV_KIT)
        fileCreated = true
      }
      const encoding = await detectEncoding(filepath)
      let envSrc = await fsx.readFileX(filepath, { encoding })
      if (envSrc.trim().length === 0) {
        envSrc = SAMPLE_ENV_KIT
        row.kitCreated = 'sample'
        row.changed = true
      }
      const envParsed = dotenvParse(envSrc)

      let publicKey
      let privateKey

      const { publicKeyName, privateKeyName } = keyNames(envFilepath)
      const { publicKeyValue, privateKeyValue } = await keyValues(envFilepath, { keysFilepath: this.envKeysFilepath, noOps: this.noOps })

      // first pass - provision
      if (!privateKeyValue && !publicKeyValue) {
        const prov = await provision({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, noOps: this.noOps })
        envSrc = prov.envSrc
        publicKey = prov.publicKey
        privateKey = prov.privateKey
        row.localPrivateKeyAdded = prov.localPrivateKeyAdded
        row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
        row.envKeysFilepath = prov.envKeysFilepath
      } else if (privateKeyValue) {
        const prov = provisionWithPrivateKey({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, privateKeyValue, publicKeyValue, publicKeyName })
        publicKey = prov.publicKey
        privateKey = prov.privateKey
        envSrc = prov.envSrc
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

          let encryptedValue
          try {
            encryptedValue = encryptValue(value, publicKey)
          } catch {
            throw new Errors({ publicKeyName, publicKey }).invalidPublicKey()
          }

          // once newSrc is built write it out
          envSrc = replace(envSrc, key, encryptedValue)

          row.changed = true // track change
        }
      }

      row.envSrc = envSrc
      if (fileCreated) {
        row.changed = true
      }
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
}

module.exports = Encrypt
