const ECIES_PATTERN = /^encrypted:.+/
const GPG_PATTERN = /^gpg:encrypted:.+/

/**
 * Check if a value is encrypted (ECIES or GPG)
 * @param {string} value - The value to check
 * @returns {boolean}
 */
function isEncrypted (value) {
  if (typeof value !== 'string') {
    return false
  }
  return ECIES_PATTERN.test(value) || GPG_PATTERN.test(value)
}

module.exports = isEncrypted
