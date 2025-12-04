const fsx = require('./../helpers/fsx')
const path = require('path')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const guessPublicKeyName = require('./../helpers/guessPublicKeyName')
const encryptValue = require('./../helpers/encryptValue')
const gpgEncryptValue = require('./../helpers/gpgEncryptValue')
const decryptKeyValue = require('./../helpers/decryptKeyValue')
const replace = require('./../helpers/replace')
const dotenvParse = require('./../helpers/dotenvParse')
const detectEncoding = require('./../helpers/detectEncoding')
const determineEnvs = require('./../helpers/determineEnvs')
const { findPrivateKey } = require('./../helpers/findPrivateKey')
const findPublicKey = require('./../helpers/findPublicKey')
const keypair = require('./../helpers/keypair')
const truncate = require('./../helpers/truncate')
const isEncrypted = require('./../helpers/isEncrypted')
const isGpgEncrypted = require('./../helpers/isGpgEncrypted')
const getCryptoProvider = require('./../helpers/getCryptoProvider')
const getGpgRecipient = require('./../helpers/getGpgRecipient')

class Sets {
  constructor (key, value, envs = [], encrypt = true, envKeysFilepath = null, options = {}) {
    this.envs = determineEnvs(envs, process.env)
    this.key = key
    this.value = value
    this.encrypt = encrypt
    this.envKeysFilepath = envKeysFilepath
    this.options = options

    // Determine crypto provider
    this.cryptoProvider = getCryptoProvider(options)

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
      const wasGpgEncrypted = isGpgEncrypted(row.originalValue)
      this.readableFilepaths.add(envFilepath)

      if (this.encrypt) {
        // GPG encryption mode
        if (this.cryptoProvider === 'gpg') {
          const gpgRecipient = getGpgRecipient(this.options, envFilepath)
          if (!gpgRecipient) {
            throw new Errors({}).missingGpgRecipient()
          }

          row.gpgRecipient = gpgRecipient
          row.cryptoProvider = 'gpg'

          // Decrypt original value if GPG-encrypted (for comparison)
          if (wasGpgEncrypted && row.originalValue) {
            row.originalValue = decryptKeyValue(row.key, row.originalValue, null, null)
          }

          // Check if DOTENV_GPG_KEY header needs to be added
          const gpgKeyName = this._guessGpgKeyName(envFilepath)
          const existingGpgKey = envParsed[gpgKeyName]

          if (!existingGpgKey) {
            const ps = this._preserveShebang(envSrc)
            const firstLinePreserved = ps.firstLinePreserved
            envSrc = ps.envSrc

            const prependGpgKey = this._prependGpgKey(gpgKeyName, gpgRecipient, filename)
            envSrc = `${firstLinePreserved}${prependGpgKey}\n${envSrc}`
          }

          row.encryptedValue = gpgEncryptValue(this.value, gpgRecipient)
        } else {
          // ECIES encryption mode (existing logic)
          let publicKey
          let privateKey

          const publicKeyName = guessPublicKeyName(envFilepath)
          const privateKeyName = guessPrivateKeyName(envFilepath)
          const existingPrivateKey = findPrivateKey(envFilepath, this.envKeysFilepath)
          const existingPublicKey = findPublicKey(envFilepath)

          let envKeysFilepath = path.join(path.dirname(filepath), '.env.keys')
          if (this.envKeysFilepath) {
            envKeysFilepath = path.resolve(this.envKeysFilepath)
          }
          const relativeFilepath = path.relative(path.dirname(filepath), envKeysFilepath)

          if (existingPrivateKey) {
            const kp = keypair(existingPrivateKey)
            publicKey = kp.publicKey
            privateKey = kp.privateKey

            if (row.originalValue) {
              row.originalValue = decryptKeyValue(row.key, row.originalValue, privateKeyName, privateKey)
            }

            // if derivation doesn't match what's in the file (or preset in env)
            if (existingPublicKey && existingPublicKey !== publicKey) {
              const error = new Error(`derived public key (${truncate(publicKey)}) does not match the existing public key (${truncate(existingPublicKey)})`)
              error.code = 'INVALID_DOTENV_PRIVATE_KEY'
              error.help = `debug info: ${privateKeyName}=${truncate(existingPrivateKey)} (derived ${publicKeyName}=${truncate(publicKey)} vs existing ${publicKeyName}=${truncate(existingPublicKey)})`
              throw error
            }

            // typical scenario when encrypting a monorepo second .env file from a prior generated -fk .env.keys file
            if (!existingPublicKey) {
              const ps = this._preserveShebang(envSrc)
              const firstLinePreserved = ps.firstLinePreserved
              envSrc = ps.envSrc

              const prependPublicKey = this._prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)

              envSrc = `${firstLinePreserved}${prependPublicKey}\n${envSrc}`
            }
          } else if (existingPublicKey) {
            publicKey = existingPublicKey
          } else {
            // .env.keys
            let keysSrc = ''
            if (fsx.existsSync(envKeysFilepath)) {
              keysSrc = fsx.readFileX(envKeysFilepath)
            }

            const ps = this._preserveShebang(envSrc)
            const firstLinePreserved = ps.firstLinePreserved
            envSrc = ps.envSrc

            const kp = keypair() // generates a fresh keypair in memory
            publicKey = kp.publicKey
            privateKey = kp.privateKey

            const prependPublicKey = this._prependPublicKey(publicKeyName, publicKey, filename, relativeFilepath)

            // privateKey
            const firstTimeKeysSrc = [
              '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
              '#/ private decryption keys. DO NOT commit to source control /',
              '#/     [how it works](https://dotenvx.com/encryption)       /',
              '#/----------------------------------------------------------/'
            ].join('\n')
            const appendPrivateKey = [
              `# ${filename}`,
              `${privateKeyName}=${privateKey}`,
              ''
            ].join('\n')

            envSrc = `${firstLinePreserved}${prependPublicKey}\n${envSrc}`
            keysSrc = keysSrc.length > 1 ? keysSrc : `${firstTimeKeysSrc}\n`
            keysSrc = `${keysSrc}\n${appendPrivateKey}`

            // write to .env.keys
            fsx.writeFileX(envKeysFilepath, keysSrc)

            row.privateKeyAdded = true
            row.envKeysFilepath = this.envKeysFilepath || path.join(path.dirname(envFilepath), path.basename(envKeysFilepath))
          }

          row.publicKey = publicKey
          row.privateKey = privateKey
          row.encryptedValue = encryptValue(this.value, publicKey)
          row.privateKeyName = privateKeyName
        }
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

  _detectEncoding (filepath) {
    return detectEncoding(filepath)
  }

  _prependPublicKey (publicKeyName, publicKey, filename, relativeFilepath = '.env.keys') {
    const comment = relativeFilepath === '.env.keys' ? '' : ` # -fk ${relativeFilepath}`

    return [
      '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
      '#/            public-key encryption for .env files          /',
      '#/       [how it works](https://dotenvx.com/encryption)     /',
      '#/----------------------------------------------------------/',
      `${publicKeyName}="${publicKey}"${comment}`,
      '',
      `# ${filename}`
    ].join('\n')
  }

  _prependGpgKey (gpgKeyName, gpgRecipient, filename) {
    return [
      '#/-------------------[DOTENV_GPG_KEY]------------------------/',
      '#/            GPG/YubiKey encryption for .env files          /',
      '#/       [how it works](https://dotenvx.com/encryption)      /',
      '#/----------------------------------------------------------/',
      `${gpgKeyName}="${gpgRecipient}"`,
      '',
      `# ${filename}`
    ].join('\n')
  }

  _guessGpgKeyName (envFilepath) {
    // Similar to guessPublicKeyName but for GPG
    // .env -> DOTENV_GPG_KEY
    // .env.production -> DOTENV_GPG_KEY_PRODUCTION
    const match = envFilepath.match(/\.env\.(.+)$/)
    if (match) {
      return `DOTENV_GPG_KEY_${match[1].toUpperCase()}`
    }
    return 'DOTENV_GPG_KEY'
  }

  _preserveShebang (envSrc) {
    // preserve shebang
    const [firstLine, ...remainingLines] = envSrc.split('\n')
    let firstLinePreserved = ''

    if (firstLine.startsWith('#!')) {
      firstLinePreserved = firstLine + '\n'
      envSrc = remainingLines.join('\n')
    }

    return {
      firstLinePreserved,
      envSrc
    }
  }
}

module.exports = Sets
