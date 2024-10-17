const dotenv = require('dotenv')

const isEncrypted = require('./isEncrypted')
const isPublicKey = require('./isPublicKey')

function isFullyEncrypted (src) {
  const parsed = dotenv.parse(src)

  for (const [key, value] of Object.entries(parsed)) {
    const result = isEncrypted(value) || isPublicKey(key, value)
    if (!result) {
      return false
    }
  }

  return true
}

module.exports = isFullyEncrypted
