const { encrypt } = require('eciesjs')

function encryptValue (value, publicKey) {
  const ciphertext = encrypt(publicKey, Buffer.from(value))
  const encoded = Buffer.from(ciphertext, 'hex').toString('base64') // base64 encode ciphertext

  return `encrypted:${encoded}`
}

module.exports = encryptValue
