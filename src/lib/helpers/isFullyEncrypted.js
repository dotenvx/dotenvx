const dotenv = require('dotenv')

const isEncrypted = require('./isEncrypted')

function isFullyEncrypted (src) {
  const parsed = dotenv.parse(src)

  for (const [key, value] of Object.entries(parsed)) {
    const result = isEncrypted(key, value)
    if (!result) {
      return false
    }
  }

  return true
}

module.exports = isFullyEncrypted
