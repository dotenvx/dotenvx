const { decrypt } = require('eciesjs')

const Errors = require('./errors')

const PREFIX = 'encrypted:'

function decryptKeyValue (key, value, privateKeyName, privateKey) {
  let decryptedValue
  let decryptionError

  if (!value.startsWith(PREFIX)) {
    return value
  }

  privateKey = privateKey || ''
  if (privateKey.length <= 0) {
    decryptionError = new Errors({ key, privateKeyName, privateKey }).missingPrivateKey()
  } else {
    const privateKeys = privateKey.split(',')
    for (const privKey of privateKeys) {
      const secret = Buffer.from(privKey, 'hex')
      const encoded = value.substring(PREFIX.length)
      const ciphertext = Buffer.from(encoded, 'base64')

      try {
        decryptedValue = decrypt(secret, ciphertext).toString()
        decryptionError = null // reset to null error (scenario for multiple private keys)
        break
      } catch (e) {
        if (e.message === 'Invalid private key') {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).invalidPrivateKey()
        } else if (e.message === 'Unsupported state or unable to authenticate data') {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).looksWrongPrivateKey()
        } else if (e.message === 'bad point: got length 65, expected compressed=33 or uncompressed=65') {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).malformedEncryptedData()
        } else {
          decryptionError = new Errors({ key, privateKeyName, privateKey, message: e.message }).decryptionFailed()
        }
      }
    }
  }

  if (decryptionError) {
    throw decryptionError
  }

  return decryptedValue
}

module.exports = decryptKeyValue
