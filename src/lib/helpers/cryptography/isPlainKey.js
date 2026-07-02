const PLAIN_KEY_PATTERN = /_PLAIN$/

function isPlainKey (key) {
  return PLAIN_KEY_PATTERN.test(key)
}

module.exports = isPlainKey
