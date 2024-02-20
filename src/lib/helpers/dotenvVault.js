const path = require('path')
const crypto = require('crypto')
const xxhash = require('xxhashjs')
const dotenv = require('dotenv')

const XXHASH_SEED = 0xABCD
const NONCE_BYTES = 12

class DotenvVault {
  constructor (dotenvFiles = {}, dotenvKeys = {}, dotenvVaults = {}) {
    this.dotenvFiles = dotenvFiles // key: filepath and value: filecontent
    this.dotenvKeys = dotenvKeys // pass current parsed dotenv keys from .env.keys
    this.dotenvVaults = dotenvVaults // pass current parsed dotenv vaults from .env.vault
  }

  run () {
    const addedVaults = new Set()
    const existingVaults = new Set()
    const addedDotenvFilenames = new Set()

    for (const [filepath, raw] of Object.entries(this.dotenvFiles)) {
      const environment = this._guessEnvironment(filepath)
      const vault = `DOTENV_VAULT_${environment.toUpperCase()}`

      let ciphertext = this.dotenvVaults[vault]
      const dotenvKey = this.dotenvKeys[`DOTENV_KEY_${environment.toUpperCase()}`]

      if (!ciphertext || ciphertext.length === 0 || this._changed(dotenvKey, ciphertext, raw)) {
        ciphertext = this._encrypt(dotenvKey, raw)
        this.dotenvVaults[vault] = ciphertext
        addedVaults.add(vault) // for info logging to user

        addedDotenvFilenames.add(path.basename(filepath)) // for info logging to user
      } else {
        existingVaults.add(vault) // for info logging to user
      }
    }

    let vaultData = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/\n\n`

    for (const [vault, value] of Object.entries(this.dotenvVaults)) {
      const environment = vault.replace('DOTENV_VAULT_', '').toLowerCase()
      vaultData += `# ${environment}\n`
      vaultData += `${vault}="${value}"\n\n`
    }

    return {
      dotenvVaultFile: vaultData,
      addedVaults: [...addedVaults], // return set as array
      existingVaults: [...existingVaults], // return set as array
      addedDotenvFilenames: [...addedDotenvFilenames] // return set as array
    }
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

  _changed (dotenvKey, ciphertext, raw) {
    const decrypted = this._decrypt(dotenvKey, ciphertext)

    return this._hash(decrypted) !== this._hash(raw)
  }

  _encrypt (dotenvKey, raw) {
    const key = this._parseEncryptionKeyFromDotenvKey(dotenvKey)

    // set up nonce
    const nonce = crypto.randomBytes(NONCE_BYTES)

    // set up cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce)

    // generate ciphertext
    let ciphertext = ''
    ciphertext += cipher.update(raw, 'utf8', 'hex')
    ciphertext += cipher.final('hex')
    ciphertext += cipher.getAuthTag().toString('hex')

    // prepend nonce
    ciphertext = nonce.toString('hex') + ciphertext

    // base64 encode output
    return Buffer.from(ciphertext, 'hex').toString('base64')
  }

  _decrypt (dotenvKey, ciphertext) {
    const key = this._parseEncryptionKeyFromDotenvKey(dotenvKey)

    try {
      return dotenv.decrypt(ciphertext, key)
    } catch (e) {
      const decryptionFailedError = new Error('[DECRYPTION_FAILED] Unable to decrypt .env.vault with DOTENV_KEY.')
      decryptionFailedError.code = 'DECRYPTION_FAILED'
      decryptionFailedError.help = '[DECRYPTION_FAILED] Run with debug flag [dotenvx run --debug -- yourcommand] or manually run [echo $DOTENV_KEY] to compare it to the one in .env.keys.'
      decryptionFailedError.debug = `[DECRYPTION_FAILED] DOTENV_KEY is ${dotenvKey}`

      switch (e.code) {
        case 'DECRYPTION_FAILED':
          throw decryptionFailedError
        default:
          throw e
      }
    }
  }

  _parseEncryptionKeyFromDotenvKey (dotenvKey) {
    // Parse DOTENV_KEY. Format is a URI
    let uri
    try {
      uri = new URL(dotenvKey)
    } catch (e) {
      const code = 'INVALID_DOTENV_KEY'
      const message = `INVALID_DOTENV_KEY: ${e.message}`
      const error = new Error(message)
      error.code = code

      throw error
    }

    // Get decrypt key
    const key = uri.password
    if (!key) {
      const code = 'INVALID_DOTENV_KEY'
      const message = 'INVALID_DOTENV_KEY: Missing key part'
      const error = new Error(message)
      error.code = code

      throw error
    }

    return Buffer.from(key.slice(-64), 'hex')
  }

  _hash (str) {
    return xxhash.h32(str, XXHASH_SEED).toString(16)
  }
}

module.exports = DotenvVault
