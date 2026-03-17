const keyNames = require('./keyNames')

function publicKeyName (filepath) {
  return keyNames(filepath).publicKeyName
}

module.exports = publicKeyName
