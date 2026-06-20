const { decrypt } = require('@dotenvx/primitives')

function decryptDeviceValue (value, privateKey) {
  return decrypt(privateKey, value, { prefix: false })
}

module.exports = decryptDeviceValue
