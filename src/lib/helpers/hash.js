const xxhash = require('xxhashjs')

const XXHASH_SEED = 0xABCD // DO NOT CHANGE

function hash (str) {
  return xxhash.h32(str, XXHASH_SEED).toString(16)
}

module.exports = hash
