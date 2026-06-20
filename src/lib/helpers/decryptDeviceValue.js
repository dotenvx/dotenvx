const { decrypt, encrypted } = require('@dotenvx/primitives')

function decryptDeviceValue (value, privateKey) {
  return decrypt(privateKey, `${encrypted.PREFIX}${value}`)
}

module.exports = decryptDeviceValue
