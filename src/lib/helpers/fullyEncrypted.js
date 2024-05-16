const dotenv = require('dotenv')

const ENCRYPTION_PATTERN = /^encrypted:.+/
const PUBLIC_KEY_PATTERN = /^DOTENV_PUBLIC_KEY/

function fullyEncrypted (src) {
  const parsed = dotenv.parse(src)

  for (const [key, value] of Object.entries(parsed)) {
    if (!PUBLIC_KEY_PATTERN.test(key) && !ENCRYPTION_PATTERN.test(value)) {
      return false
    }
  }

  return true
}

module.exports = fullyEncrypted
