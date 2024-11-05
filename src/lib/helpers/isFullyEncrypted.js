const parseEnv = require('./parseEnv')
const isEncrypted = require('./isEncrypted')
const isPublicKey = require('./isPublicKey')

function isFullyEncrypted (src) {
  const parsed = parseEnv(src)

  for (const { key, value, isExported } of parsed) {
    const result = isExported || isEncrypted(value) || isPublicKey(key, value)
    if (!result) {
      return false
    }
  }

  return true
}

module.exports = isFullyEncrypted
