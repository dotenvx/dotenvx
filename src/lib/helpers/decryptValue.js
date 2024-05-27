const { decrypt } = require('eciesjs')

const PREFIX = 'encrypted:'

function decryptValue (value, privateKey) {
  if (!value.startsWith(PREFIX)) {
    return value
  }

  const privateKeys = privateKey.split(',')

  let decryptedValue
  for (const key of privateKeys) {
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

  // return 'encrypted:string' value if undefined or null
  if (decryptedValue === undefined || decryptedValue === null) {
    return value
  }

  return decryptedValue
}

module.exports = decryptValue
