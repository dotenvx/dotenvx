const keyValues = require('./keyValues')

function smartPublicKey (filepath) {
  return keyValues(filepath).publicKeyValue
}

module.exports = smartPublicKey
