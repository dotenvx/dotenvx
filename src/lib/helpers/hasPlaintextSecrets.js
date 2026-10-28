const { sealed } = require('@dotenvx/primitives')

function hasPlaintextSecrets (src, storagePolicy) {
  return !sealed(src, storagePolicy)
}

module.exports = hasPlaintextSecrets
