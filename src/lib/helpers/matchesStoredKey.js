const { derive } = require('@dotenvx/primitives')

module.exports = function matchesStoredKey (publicKey, value) {
  try { return derive(value) === publicKey } catch { return false }
}
