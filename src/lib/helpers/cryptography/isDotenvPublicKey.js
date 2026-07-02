const PUBLIC_KEY_PATTERN = /^DOTENV_PUBLIC_KEY/

function isDotenvPublicKey (key) {
  return PUBLIC_KEY_PATTERN.test(key)
}

module.exports = isDotenvPublicKey
