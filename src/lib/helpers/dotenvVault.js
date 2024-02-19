const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const xxhash = require('xxhashjs')
const dotenv = require('dotenv')

const ENCODING = 'utf8'
const XXHASH_SEED = 0xABCD
const NONCE_BYTES = 12

class DotenvVault {
  constructor (directory = './', envFile = '.env') {
    this.directory = directory
    this.envKeysFilepath = path.resolve(this.directory, '.env.keys')
    this.envVaultFilepath = path.resolve(this.directory, '.env.vault')
    this.envFile = envFile
  }

  run () {
    if (this.envFile.length < 1) {
      const code = 'DOTENV_MISSING_ENV_FILE'
      const message = 'no .env* files found'
      const help = `? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]`

      const error = new Error(message)
      error.code = code
      error.help = help
      throw error
    }

    const addedVaults = new Set()
    const existingVaults = new Set()
    const addedEnvFilepaths = new Set()
    const dotenvKeys = this._parsedDotenvKeys()
    const dotenvVaults = this._parsedDotenvVault()

    for (const envFilepath of this._envFilepaths()) {
      const filepath = path.resolve(this.directory, envFilepath)
      if (!fs.existsSync(filepath)) {
        const code = 'DOTENV_FILE_DOES_NOT_EXIST'
        const message = `file does not exist at [${filepath}]`
        const help = `? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx encrypt]`

        const error = new Error(message)
        error.code = code
        error.help = help
        throw error
      }

      const environment = this._guessEnvironment(filepath)
      const vault = `DOTENV_VAULT_${environment.toUpperCase()}`

      let ciphertext = dotenvVaults[vault]
      const dotenvKey = dotenvKeys[`DOTENV_KEY_${environment.toUpperCase()}`]

      if (!ciphertext || ciphertext.length === 0 || this._changed(ciphertext, dotenvKey, filepath, ENCODING)) {
        ciphertext = this._encryptFile(filepath, dotenvKey, ENCODING)
        dotenvVaults[vault] = ciphertext
        addedVaults.add(vault) // for info logging to user
        addedEnvFilepaths.add(envFilepath) // for info logging to user
      } else {
        existingVaults.add(vault) // for info logging to user
      }
    }

    let vaultData = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/\n\n`

    for (const vault in dotenvVaults) {
      const value = dotenvVaults[vault]
      const environment = vault.replace('DOTENV_VAULT_', '').toLowerCase()
      vaultData += `# ${environment}\n`
      vaultData += `${vault}="${value}"\n\n`
    }

    return {
      envVault: vaultData,
      addedVaults: [...addedVaults], // return set as array
      existingVaults: [...existingVaults], // return set as array
      addedEnvFilepaths: [...addedEnvFilepaths], // return set as array
      dotenvKeys: dotenvKeys
    }
  }

  _parsedDotenvKeys () {
    const options = {
      path: this.envKeysFilepath
    }

    return dotenv.configDotenv(options).parsed || {}
  }

  _parsedDotenvVault () {
    const options = {
      path: this.envVaultFilepath
    }

    return dotenv.configDotenv(options).parsed || {}
  }

  _guessEnvironment (filepath) {
    const filename = path.basename(filepath)
    const parts = filename.split('.')
    const possibleEnvironment = parts[2] // ['', 'env', environment', 'previous']

    if (!possibleEnvironment || possibleEnvironment.length === 0) {
      return 'development'
    }

    return possibleEnvironment
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }

  _changed (ciphertext, dotenvKey, filepath, encoding) {
    const key = this._parseEncryptionKeyFromDotenvKey(dotenvKey)
    const decrypted = this._decrypt(ciphertext, key)
    const raw = fs.readFileSync(filepath, encoding)

    return this._hash(decrypted) !== this._hash(raw)
  }

  _parseEncryptionKeyFromDotenvKey (dotenvKey) {
    // Parse DOTENV_KEY. Format is a URI
    let uri
    try {
      uri = new URL(dotenvKey)
    } catch (e) {
      throw new Error(`INVALID_DOTENV_KEY: ${e.message}`)
    }

    // Get decrypt key
    const key = uri.password
    if (!key) {
      throw new Error('INVALID_DOTENV_KEY: Missing key part')
    }

    return Buffer.from(key.slice(-64), 'hex')
  }

  _decrypt (encrypted, keyStr) {
    try {
      return dotenv.decrypt(encrypted, keyStr)
    } catch (e) {
      switch (e.code) {
        case 'DECRYPTION_FAILED':
          const code = 'DECRYPTION_FAILED'
          const message = '[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.'
          const help = '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.'
          const debug = `[DECRYPTION_FAILED] DOTENV_KEY is ${process.env.DOTENV_KEY}`

          const error = new Error(message)
          error.code = code
          error.help = help
          error.debug = debug
          throw error
        default:
          throw e
      }
    }
  }

  _hash (str) {
    return xxhash.h32(str, XXHASH_SEED).toString(16)
  }

  _encryptFile () {
    const key = this._parseEncryptionKeyFromDotenvKey(dotenvKey)
    const message = fs.readFileSync(filepath, encoding)
    const ciphertext = this._encrypt(key, message)

    return ciphertext
  }

  _encrypt (key, message) {
    // set up nonce
    const nonce = crypto.randomBytes(NONCE_BYTES)

    // set up cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)

    // generate ciphertext
    let ciphertext = ''
    ciphertext += cipher.update(message, 'utf8', 'hex')
    ciphertext += cipher.final('hex')
    ciphertext += cipher.getAuthTag().toString('hex')

    // prepend nonce
    ciphertext = nonce.toString('hex') + ciphertext

    // base64 encode output
    return Buffer.from(ciphertext, 'hex').toString('base64')
  }
}

module.exports = DotenvVault
