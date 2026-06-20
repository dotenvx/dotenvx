const fsx = require('./../helpers/fsx')
const path = require('path')
const picomatch = require('picomatch')
const { encrypted, scan } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')

const {
  determine
} = require('./../helpers/envResolution')

const {
  keyNamesForEnvFile,
  keyValues
} = require('./../helpers/keyResolution')

const {
  encryptValue,
  isPublicKey,
  provision,
  provisionWithPrivateKey
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const detectEncoding = require('./../helpers/detectEncoding')
const SAMPLE_ENV_KIT = require('./../helpers/kits/sample')

class Encrypt {
  constructor (envs = [], key = [], excludeKey = [], envKeysFilepath = null, noArmor = false, noCreate = false, token = undefined, options = {}) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.excludeKey = excludeKey
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.noCreate = noCreate
    this.token = token
    this.selectKeyStorage = options.selectKeyStorage
    this.command = options.command

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
      const fileExists = await fsx.exists(filepath)
      let envSrc
      if (!fileExists && !this.noCreate) {
        envSrc = SAMPLE_ENV_KIT
        fileCreated = true
        row.kitCreated = 'sample'
        row.changed = true
      } else {
        const encoding = await detectEncoding(filepath)
        envSrc = await fsx.readFileX(filepath, { encoding })
      }
      if (envSrc.trim().length === 0) {
        envSrc = SAMPLE_ENV_KIT
        row.kitCreated = 'sample'
        row.changed = true
      }
      const envParsed = scan(envSrc).parsed

      let publicKey
      let privateKey

      const { publicKeyName, privateKeyName } = keyNamesForEnvFile(envFilepath)
      const { publicKeyValue, privateKeyValue } = await keyValues(envFilepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command
      })

      // first pass - provision
      if (!privateKeyValue && !publicKeyValue) {
        const prov = await provision({
          envSrc,
          envFilepath,
          keysFilepath: this.envKeysFilepath,
          noArmor: this.noArmor,
          token: this.token,
          selectKeyStorage: this.selectKeyStorage,
          command: this.command
        })
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
      for (const [key, values] of Object.entries(envParsed)) {
        // key excluded - don't encrypt it
        if (this.exclude(key)) {
          continue
        }

        // key effectively excluded (by not being in the list of includes) - don't encrypt it
        if (this.keys.length > 0 && !this.include(key)) {
          continue
        }

        const fullyEncrypted = values.every(value => encrypted(value) || isPublicKey(key))
        if (!fullyEncrypted) {
          row.keys.push(key) // track key(s)

          const encryptedValues = values.map(value => {
            if (encrypted(value) || isPublicKey(key)) {
              return value
            }

            try {
              return encryptValue(value, publicKey)
            } catch {
              throw new Errors({ publicKeyName, publicKey }).invalidPublicKey()
            }
          })

          // once newSrc is built write it out
          envSrc = replace(envSrc, key, encryptedValues)

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
