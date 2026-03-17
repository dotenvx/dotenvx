const guessKeyNames = require('./guessKeyNames')

function publicKeyName (filepath) {
  return guessKeyNames(filepath).publicKeyName
}

module.exports = publicKeyName
