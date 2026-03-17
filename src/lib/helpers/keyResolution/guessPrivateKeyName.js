const guessKeyNames = require('./guessKeyNames')

function guessPrivateKeyName (filepath) {
  return guessKeyNames(filepath).privateKeyName
}

module.exports = guessPrivateKeyName
