const { encrypted } = require('@dotenvx/primitives')

function isEncrypted (value) {
  if (!value) {
    return false
  }

  return encrypted(value)
}

module.exports = isEncrypted
