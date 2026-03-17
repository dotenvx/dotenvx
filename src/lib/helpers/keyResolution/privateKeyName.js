const keyNames = require('./keyNames')

function privateKeyName (filepath) {
  return keyNames(filepath).privateKeyName
}

module.exports = privateKeyName
