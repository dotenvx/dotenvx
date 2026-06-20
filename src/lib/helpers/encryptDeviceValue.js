const { encrypt } = require('@dotenvx/primitives')

function encryptDeviceValue (value, publicKey) {
  return encrypt(publicKey, value, { prefix: false })
}

module.exports = encryptDeviceValue
