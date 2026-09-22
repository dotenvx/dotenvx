const { sealed } = require('@dotenvx/primitives')

function hasPlaintextSecrets (src) {
  return !sealed(src)
}

module.exports = hasPlaintextSecrets
