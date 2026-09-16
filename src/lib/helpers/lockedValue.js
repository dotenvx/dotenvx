const crypto = require('crypto')

function lockedValue (privateKey, passphrase, publicKey) {
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = crypto.scryptSync(passphrase, salt, 32)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([
    cipher.update(privateKey, 'utf8'),
    cipher.final()
  ])
  const tag = cipher.getAuthTag()
  const payload = Buffer.concat([
    Buffer.from([1]),
    salt,
    iv,
    tag,
    ciphertext
  ]).toString('base64url')

  return `locked:${publicKey}:${payload}`
}

module.exports = lockedValue
