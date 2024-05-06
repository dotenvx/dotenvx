const { decrypt } = require('eciesjs')
const parseKey = require('./parseKey')

const PREFIX = 'encrypted:'

function decryptValue (value, DOTENV_PRIVATE_KEY) {
  if (!value.startsWith(PREFIX)) {
    return value
  }

  const { key } = parseKey(DOTENV_PRIVATE_KEY)

  const secret = Buffer.from(key, 'hex')
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
