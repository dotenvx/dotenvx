const { decrypt } = require('eciesjs')

const PREFIX = 'encrypted:'

function decryptValue (value, privateKey) {
  if (!value.startsWith(PREFIX)) {
    return value
  }

  const secret = Buffer.from(privateKey, 'hex')
  const encoded = value.substring(PREFIX.length)
  const ciphertext = Buffer.from(encoded, 'base64')

  try {
    return decrypt(secret, ciphertext).toString()
  } catch (error) {
    // TODO: somehow surface these errors to the user's logs
    return value
  }
}

module.exports = decryptValue
