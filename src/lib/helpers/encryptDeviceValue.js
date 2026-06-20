const { encrypt, encrypted } = require('@dotenvx/primitives')

function encryptDeviceValue (value, publicKey) {
  const encryptedValue = encrypt(publicKey, value)

  return encryptedValue.substring(encrypted.PREFIX.length)
}

module.exports = encryptDeviceValue
