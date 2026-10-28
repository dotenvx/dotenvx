const PLAIN_KEY_PATTERN = /_PLAIN$/

function isPlaintext (key, storagePolicy) {
  const keys = storagePolicy?.keys
  const entry = keys && (Object.hasOwn(keys, key) ? keys[key] : keys['*'])
  const type = entry?.storage?.type

  if (type === 'plaintext') return true
  if (type === 'encrypted') return false

  return PLAIN_KEY_PATTERN.test(key)
}

module.exports = isPlaintext
