const { encrypt } = require('eciesjs')

function encryptDeviceValue (value, publicKey) {
  const ciphertext = encrypt(publicKey, Buffer.from(value))

  return Buffer.from(ciphertext, 'hex').toString('base64')
}

module.exports = encryptDeviceValue
