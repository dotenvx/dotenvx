const crypto = require('crypto')

function unlockedValue (lockedPrivateKey, passphrase) {
  const parts = lockedPrivateKey.split(':')
  const payload = Buffer.from(parts.slice(2).join(':'), 'base64url')
  const version = payload.subarray(0, 1)[0]
  const salt = payload.subarray(1, 17)
  const iv = payload.subarray(17, 29)
  const tag = payload.subarray(29, 45)
  const ciphertext = payload.subarray(45)
  const key = crypto.scryptSync(passphrase, salt, 32)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)

  if (version !== 1) {
    throw new Error('unsupported locked private key version')
  }

  decipher.setAuthTag(tag)

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]).toString('utf8')
}

module.exports = unlockedValue
