const smartKeyValues = require('./smartKeyValues')

function smartPublicKey (filepath) {
  return smartKeyValues(filepath).publicKeyValue
}

module.exports = smartPublicKey
