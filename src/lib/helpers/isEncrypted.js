const ENCRYPTION_PATTERN = /^encrypted:.+/
const PUBLIC_KEY_PATTERN = /^DOTENV_PUBLIC_KEY/

function isEncrypted (key, value) {
  return PUBLIC_KEY_PATTERN.test(key) || ENCRYPTION_PATTERN.test(value)
}

module.exports = isEncrypted
