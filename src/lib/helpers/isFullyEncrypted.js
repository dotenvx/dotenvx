const dotenvParse = require('./dotenvParse')
const isEncrypted = require('./isEncrypted')
const isPublicKey = require('./isPublicKey')

function isFullyEncrypted (src) {
  const parsed = dotenvParse(src)

  for (const [key, value] of Object.entries(parsed)) {
    const result = isEncrypted(value) || isPublicKey(key, value)
    if (!result) {
      return false
    }
  }

  return true
}

module.exports = isFullyEncrypted
