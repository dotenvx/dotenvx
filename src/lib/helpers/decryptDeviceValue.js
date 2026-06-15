const { decrypt } = require('eciesjs')

function decryptDeviceValue (value, privateKey) {
  const secret = Buffer.from(privateKey, 'hex')
  const ciphertext = Buffer.from(value, 'base64')

  return decrypt(secret, ciphertext).toString()
}

module.exports = decryptDeviceValue
