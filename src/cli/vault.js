const fs = require('fs')
const crypto = require('crypto')

const keys = require('./keys')

const logger = require('./../shared/logger')

const filename = function () {
  return '.env.vault'
}

const data = function () {
  let data = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenv.org/env-vault)   /
#/--------------------------------------------------/\n\n`

  const _this = this
  const envLookups = keys.envLookups()
  const dotenvKeys = keys.keys()

  for (const file in envLookups) {
    if (Object.prototype.hasOwnProperty.call(envLookups, file)) {
      const environment = envLookups[file]
      const environmentUpcase = environment.toUpperCase()

      const dotenvKey = dotenvKeys[`DOTENV_KEY_${environmentUpcase}`]

      const message = fs.readFileSync(file, 'utf8')
      const key = _this._parseEncryptionKeyFromDotenvKey(dotenvKey)
      const ciphertext = _this._encrypt(key, message)

      data += `# ${environment}\n`
      data += `DOTENV_VAULT_${environmentUpcase}="${ciphertext}"\n\n`
    }
  }

  return data
}

const _parseEncryptionKeyFromDotenvKey = function (dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  const uri = new URL(dotenvKey)

  // Get decrypt key
  const key = uri.password
  if (!key) {
    throw new Error('INVALID_DOTENV_KEY: Missing key part')
  }

  return Buffer.from(key.slice(-64), 'hex')
}

const _encrypt = function (key, message) {
  // set up nonce
  const nonce = this._generateNonce()

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

const _generateNonce = function () {
  return crypto.randomBytes(this._nonceBytes())
}

const _nonceBytes = function () {
  return 12
}

module.exports = {
  filename,
  data,
  _parseEncryptionKeyFromDotenvKey,
  _encrypt,
  _generateNonce,
  _nonceBytes
}
