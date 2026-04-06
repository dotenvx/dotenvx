const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')

const {
  determine
} = require('./../helpers/envResolution')

const {
  keyNames,
  keyValues,
  keyValuesSync
} = require('./../helpers/keyResolution')

const {
  encryptValue,
  decryptKeyValue,
  isEncrypted,
  provision,
  provisionSync,
  provisionWithPrivateKey
} = require('./../helpers/cryptography')

const replace = require('./../helpers/replace')
const dotenvParse = require('./../helpers/dotenvParse')
const detectEncoding = require('./../helpers/detectEncoding')
const detectEncodingSync = require('./../helpers/detectEncodingSync')

class Sets {
  constructor (key, value, envs = [], encrypt = true, envKeysFilepath = null, noOps = false, noCreate = false) {
    this.envs = determine(envs, process.env)
    this.key = key
    this.value = value
    this.encrypt = encrypt
    this.envKeysFilepath = envKeysFilepath
    this.noOps = noOps
    this.noCreate = noCreate

    this.processedEnvs = []
    this.changedFilepaths = new Set()
    this.unchangedFilepaths = new Set()
    this.readableFilepaths = new Set()
  }

  runSync () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        this._setEnvFileSync(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  async run () {
    // example
    // envs [
    //   { type: 'envFile', value: '.env' }
    // ]

    for (const env of this.envs) {
      if (env.type === TYPE_ENV_FILE) {
        await this._setEnvFile(env.value)
      }
    }

    return {
      processedEnvs: this.processedEnvs,
      changedFilepaths: [...this.changedFilepaths],
      unchangedFilepaths: [...this.unchangedFilepaths]
    }
  }

  _setEnvFileSync (envFilepath) {
    const row = {}
    row.key = this.key || null
    row.value = this.value || null
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath
    row.changed = false

    try {
      let seededWithInitialKey = false

      if (!fsx.existsSync(filepath)) {
        if (this.noCreate) {
          detectEncodingSync(filepath) // throws ENOENT
        } else {
          fsx.writeFileXSync(filepath, '')
        }
      }

      const encoding = detectEncodingSync(filepath)
      let envSrc = fsx.readFileXSync(filepath, { encoding })

      // blank files seeded by `set` should contain only the key being set
      if (row.key && envSrc.trim().length === 0) {
        envSrc = `${row.key}="${this.value}"\n`
        seededWithInitialKey = true
      }

      const envParsed = dotenvParse(envSrc)
      row.originalValue = envParsed[row.key] || null
      if (seededWithInitialKey) {
        row.originalValue = null
      }
      const wasPlainText = !isEncrypted(row.originalValue)
      this.readableFilepaths.add(envFilepath)

      if (this.encrypt) {
        let publicKey
        let privateKey

        const { publicKeyName, privateKeyName } = keyNames(filepath)
        const { publicKeyValue, privateKeyValue } = keyValuesSync(filepath, { keysFilepath: this.envKeysFilepath, noOps: this.noOps })

        // first pass - provisionSync
        if (!privateKeyValue && !publicKeyValue) {
          const prov = provisionSync({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, noOps: this.noOps })
          envSrc = prov.envSrc
          publicKey = prov.publicKey
          privateKey = prov.privateKey
          row.envKeysFilepath = prov.envKeysFilepath
          row.localPrivateKeyAdded = prov.localPrivateKeyAdded
          row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
        } else if (privateKeyValue) {
          const prov = provisionWithPrivateKey({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, privateKeyValue, publicKeyValue, publicKeyName })
          publicKey = prov.publicKey
          privateKey = prov.privateKey
          envSrc = prov.envSrc

          if (row.originalValue) {
            row.originalValue = decryptKeyValue(row.key, row.originalValue, privateKeyName, privateKey)
          }
        } else if (publicKeyValue) {
          publicKey = publicKeyValue
        }

        row.publicKey = publicKey
        row.privateKey = privateKey
        try {
          row.encryptedValue = encryptValue(this.value, publicKey)
        } catch {
          throw new Errors({ publicKeyName, publicKey }).invalidPublicKey()
        }
        row.privateKeyName = privateKeyName
      }

      const goingFromPlainTextToEncrypted = wasPlainText && this.encrypt
      const valueChanged = this.value !== row.originalValue
      const shouldPersistSeededPlainValue = seededWithInitialKey && !this.encrypt

      if (shouldPersistSeededPlainValue) {
        row.envSrc = envSrc
        this.changedFilepaths.add(envFilepath)
        row.changed = true
      } else if (goingFromPlainTextToEncrypted || valueChanged) {
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

  async _setEnvFile (envFilepath) {
    const row = {}
    row.key = this.key || null
    row.value = this.value || null
    row.type = TYPE_ENV_FILE

    const filepath = path.resolve(envFilepath)
    row.filepath = filepath
    row.envFilepath = envFilepath
    row.changed = false

    try {
      let seededWithInitialKey = false

      if (!(await fsx.exists(filepath))) {
        if (this.noCreate) {
          await detectEncoding(filepath) // throws ENOENT
        } else {
          await fsx.writeFileX(filepath, '')
        }
      }

      const encoding = await detectEncoding(filepath)
      let envSrc = await fsx.readFileX(filepath, { encoding })

      // blank files seeded by `set` should contain only the key being set
      if (row.key && envSrc.trim().length === 0) {
        envSrc = `${row.key}="${this.value}"\n`
        seededWithInitialKey = true
      }

      const envParsed = dotenvParse(envSrc)
      row.originalValue = envParsed[row.key] || null
      if (seededWithInitialKey) {
        row.originalValue = null
      }
      const wasPlainText = !isEncrypted(row.originalValue)
      this.readableFilepaths.add(envFilepath)

      if (this.encrypt) {
        let publicKey
        let privateKey

        const { publicKeyName, privateKeyName } = keyNames(filepath)
        const { publicKeyValue, privateKeyValue } = await keyValues(filepath, { keysFilepath: this.envKeysFilepath, noOps: this.noOps })

        // first pass - provision
        if (!privateKeyValue && !publicKeyValue) {
          const prov = await provision({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, noOps: this.noOps })
          envSrc = prov.envSrc
          publicKey = prov.publicKey
          privateKey = prov.privateKey
          row.envKeysFilepath = prov.envKeysFilepath
          row.localPrivateKeyAdded = prov.localPrivateKeyAdded
          row.remotePrivateKeyAdded = prov.remotePrivateKeyAdded
        } else if (privateKeyValue) {
          const prov = provisionWithPrivateKey({ envSrc, envFilepath, keysFilepath: this.envKeysFilepath, privateKeyValue, publicKeyValue, publicKeyName })
          publicKey = prov.publicKey
          privateKey = prov.privateKey
          envSrc = prov.envSrc

          if (row.originalValue) {
            row.originalValue = decryptKeyValue(row.key, row.originalValue, privateKeyName, privateKey)
          }
        } else if (publicKeyValue) {
          publicKey = publicKeyValue
        }

        row.publicKey = publicKey
        row.privateKey = privateKey
        try {
          row.encryptedValue = encryptValue(this.value, publicKey)
        } catch {
          throw new Errors({ publicKeyName, publicKey }).invalidPublicKey()
        }
        row.privateKeyName = privateKeyName
      }

      const goingFromPlainTextToEncrypted = wasPlainText && this.encrypt
      const valueChanged = this.value !== row.originalValue
      const shouldPersistSeededPlainValue = seededWithInitialKey && !this.encrypt

      if (shouldPersistSeededPlainValue) {
        row.envSrc = envSrc
        this.changedFilepaths.add(envFilepath)
        row.changed = true
      } else if (goingFromPlainTextToEncrypted || valueChanged) {
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
}

module.exports = Sets
