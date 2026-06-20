const { decrypt } = require('@dotenvx/primitives')

const Errors = require('./../errors')

const PREFIX = 'encrypted:'

function primitiveMessage (error) {
  return error.message.replace(/^\[[A-Z_]+\] /, '')
}

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
      try {
        decryptedValue = decrypt(privKey, value)
        decryptionError = null // reset to null error (scenario for multiple private keys)
        break
      } catch (e) {
        if (e.code === 'INVALID_PRIVATE_KEY') {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).invalidPrivateKey()
        } else if (e.code === 'WRONG_PRIVATE_KEY') {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).wrongPrivateKey()
        } else if (e.code === 'MALFORMED_ENCRYPTED_DATA' || primitiveMessage(e).startsWith('bad point:')) {
          decryptionError = new Errors({ key, privateKeyName, privateKey }).malformedEncryptedData()
        } else {
          decryptionError = new Errors({ key, privateKeyName, privateKey, message: primitiveMessage(e) }).decryptionFailed()
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
