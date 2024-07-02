const ENCRYPTION_PATTERN = /^encrypted:.+/

function isEncrypted (key, value) {
  return ENCRYPTION_PATTERN.test(value)
}

module.exports = isEncrypted
