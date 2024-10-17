const { decrypt } = require('eciesjs')

const truncate = require('./truncate')

const PREFIX = 'encrypted:'

function decryptValue (value, privateKey) {
  let decryptedValue
  let decryptionError

  if (!value.startsWith(PREFIX)) {
    return value
  }

  privateKey = privateKey || ''
  if (privateKey.length <= 0) {
    decryptionError = new Error('private key missing or blank')
    decryptionError.code = 'DECRYPTION_FAILED'
  } else {
    const privateKeys = privateKey.split(',')
    for (const key of privateKeys) {
      const secret = Buffer.from(key, 'hex')
      const encoded = value.substring(PREFIX.length)
      const ciphertext = Buffer.from(encoded, 'base64')

      try {
        decryptedValue = decrypt(secret, ciphertext).toString()
        decryptionError = null // reset to null error (scenario for multiple private keys)
        break
      } catch (e) {
        if (e.message === 'Invalid private key') {
          decryptionError = new Error(`private key [${truncate(privateKey)}] looks invalid`)
        } else if (e.message === 'Unsupported state or unable to authenticate data') {
          decryptionError = new Error(`private key [${truncate(privateKey)}] looks wrong`)
        } else if (e.message === 'Point of length 65 was invalid. Expected 33 compressed bytes or 65 uncompressed bytes') {
          decryptionError = new Error('encrypted data looks malformed')
        } else {
          decryptionError = new Error(`${e.message}`)
        }

        decryptionError.code = 'DECRYPTION_FAILED'
      }
    }
  }

  if (decryptionError) {
    throw decryptionError
  }

  return decryptedValue
}

module.exports = decryptValue
