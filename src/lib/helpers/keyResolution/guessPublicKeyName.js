const guessKeyNames = require('./guessKeyNames')

function guessPublicKeyName (filepath) {
  return guessKeyNames(filepath).publicKeyName
}

module.exports = guessPublicKeyName
