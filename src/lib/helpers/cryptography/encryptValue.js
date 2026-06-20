const { encrypt } = require('@dotenvx/primitives')

function encryptValue (value, publicKey) {
  return encrypt(publicKey, value)
}

module.exports = encryptValue
