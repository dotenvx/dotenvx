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
  isEncrypted
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

        const { publicKeyName, privateKeyName } = keyNames(envFilepath)
        const { publicKeyValue, privateKeyValue } = keyValues(envFilepath, { keysFilepath: this.envKeysFilepath, opsOn: this.opsOn })

        // first pass - values will be null
        // throw new Error(`implement: ${publicKeyName}=${publicKeyValue} ${privateKeyName}=${privateKeyValue}`)

        // custom envKeysFilepath
        let envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
        if (this.envKeysFilepath) {
          envKeysFilepath = path.resolve(this.envKeysFilepath)
        }

        // relativeFilepath
        const relativeFilepath = path.relative(path.dirname(filepath), envKeysFilepath)

        if (!privateKeyValue && !publicKeyValue) {
          const firstTime = this._handleFirstTime({
            envSrc,
            envFilepath,
            envKeysFilepath,
            filename,
            relativeFilepath,
            publicKeyName,
            privateKeyName
          })

          envSrc = firstTime.envSrc
          publicKey = firstTime.publicKey
          privateKey = firstTime.privateKey
          row.privateKeyAdded = firstTime.privateKeyAdded
          row.envKeysFilepath = firstTime.envKeysFilepath
        } else if (privateKeyValue) {
          // handle existing privateKeyValue
          const kp = deriveKeypair(privateKeyValue)
          publicKey = kp.publicKey
          privateKey = kp.privateKey

          if (row.originalValue) {
            row.originalValue = decryptKeyValue(row.key, row.originalValue, privateKeyName, privateKey)
          }

          // if derivation doesn't match what's in the file (or preset in env)
          if (publicKeyValue && publicKeyValue !== publicKey) {
            const error = new Error(`derived public key (${truncate(publicKey)}) does not match the existing public key (${truncate(publicKeyValue)})`)
            error.code = 'INVALID_DOTENV_PRIVATE_KEY'
            error.help = `debug info: ${privateKeyName}=${truncate(privateKeyValue)} (derived ${publicKeyName}=${truncate(publicKey)} vs existing ${publicKeyName}=${truncate(publicKeyValue)})`
            throw error
          }

          // typical scenario when encrypting a monorepo second .env file from a prior generated -fk .env.keys file
          if (!publicKeyValue) {
            const ps = preserveShebang(envSrc)
            const firstLinePreserved = ps.firstLinePreserved
            envSrc = ps.envSrc

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

  _handleFirstTime ({ envSrc, envFilepath, envKeysFilepath, filename, relativeFilepath, publicKeyName, privateKeyName }) {
    let keysSrc = ''
    if (fsx.existsSync(envKeysFilepath)) {
      keysSrc = fsx.readFileX(envKeysFilepath)
    }

    const ps = preserveShebang(envSrc)
    const firstLinePreserved = ps.firstLinePreserved
    envSrc = ps.envSrc

    const kp = deriveKeypair() // generates a fresh keypair in memory
    const publicKey = kp.publicKey
    const privateKey = kp.privateKey

    const prependedPublicKey = prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)

    const firstTimeKeysSrc = [
      '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
      '#/ private decryption keys. DO NOT commit to source control /',
      '#/     [how it works](https://dotenvx.com/encryption)       /',
      // '#/           backup with: `dotenvx ops backup`              /',
      '#/----------------------------------------------------------/'
    ].join('\n')
    const appendPrivateKey = [
      `# ${filename}`,
      `${privateKeyName}=${privateKey}`,
      ''
    ].join('\n')

    envSrc = `${firstLinePreserved}${prependedPublicKey}\n${envSrc}`
    keysSrc = keysSrc.length > 1 ? keysSrc : `${firstTimeKeysSrc}\n`
    keysSrc = `${keysSrc}\n${appendPrivateKey}`

    fsx.writeFileX(envKeysFilepath, keysSrc)

    return {
      envSrc,
      publicKey,
      privateKey,
      privateKeyAdded: true,
      envKeysFilepath: this.envKeysFilepath || path.join(path.dirname(envFilepath), path.basename(envKeysFilepath))
    }
  }

  _detectEncoding (filepath) {
    return detectEncoding(filepath)
  }
}

module.exports = Sets
