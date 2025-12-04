const GPG_PREFIX = 'gpg:encrypted:'

/**
 * Check if a value is GPG-encrypted
 * @param {string} value - The value to check
 * @returns {boolean}
 */
function isGpgEncrypted (value) {
  if (typeof value !== 'string') {
    return false
  }
  return value.startsWith(GPG_PREFIX)
}

module.exports = isGpgEncrypted
module.exports.GPG_PREFIX = GPG_PREFIX
