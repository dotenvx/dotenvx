const { encrypted } = require('@dotenvx/primitives')
const dotenvParse = require('./dotenvParse')
const isPublicKey = require('./cryptography/isPublicKey')

function isFullyEncrypted (src) {
  const parsed = dotenvParse(src, false, false, true) // collect all values

  for (const [key, values] of Object.entries(parsed)) {
    // handle scenario where user mistakenly includes plaintext duplicate in .env:
    //
    // # .env
    // HELLO="World"
    // HELLO="encrypted:1234"
    //
    // key => [value1, ...]
    for (const value of values) {
      const result = encrypted(value) || isPublicKey(key)
      if (!result) {
        return false
      }
    }
  }

  return true
}

module.exports = isFullyEncrypted
