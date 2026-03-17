const guessKeyNames = require('./guessKeyNames')

function privateKeyName (filepath) {
  return guessKeyNames(filepath).privateKeyName
}

module.exports = privateKeyName
