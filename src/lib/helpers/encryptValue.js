const { encrypt } = require('eciesjs')

const PREFIX = 'encrypted:'

function encryptValue (value, DOTENV_PUBLIC_KEY) {
  const ciphertext = encrypt(DOTENV_PUBLIC_KEY, Buffer.from(value))
  const encoded = Buffer.from(ciphertext, 'hex').toString('base64') // base64 encode ciphertext

  return `${PREFIX}${encoded}`
}

module.exports = encryptValue
