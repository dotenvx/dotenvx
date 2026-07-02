const PUBLIC_KEY_PATTERN = /^PUBLIC_/

function isPublicKey (key) {
  return PUBLIC_KEY_PATTERN.test(key)
}

module.exports = isPublicKey
