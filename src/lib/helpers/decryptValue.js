const { decrypt } = require('eciesjs')
const parseKey = require('./parseKey')

const PREFIX = 'encrypted:'

function decryptValue (value, DOTENV_PRIVATE_KEY) {
  if (!value.startsWith(PREFIX)) {
    return value
  }

  const privateKeys = DOTENV_PRIVATE_KEY.split(',')

  let decryptedValue
  for (const privateKey of privateKeys) {
    const { key } = parseKey(privateKey)
    const secret = Buffer.from(key, 'hex')
    const encoded = value.substring(PREFIX.length)
    const ciphertext = Buffer.from(encoded, 'base64')

    try {
      decryptedValue = decrypt(secret, ciphertext).toString()
      break
    } catch (_error) {
      // TODO: somehow surface these errors to the user's logs
    }
  }

  return decryptedValue || value
}

module.exports = decryptValue
