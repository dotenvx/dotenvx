const decrypt = require('./decrypt')
const hash = require('./hash')

function changed (ciphertext, raw, dotenvKey) {
  const decrypted = decrypt(ciphertext, dotenvKey)

  return hash(decrypted) !== hash(raw)
}

module.exports = changed
