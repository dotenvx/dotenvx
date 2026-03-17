const keyValues = require('./keyValues')

function publicKeyValue (filepath) {
  return keyValues(filepath).publicKeyValue
}

module.exports = publicKeyValue
