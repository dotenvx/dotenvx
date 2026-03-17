const smartKeyValues = require('./smartKeyValues')

function smartPrivateKey (filepath, keysFilepath = null, opsOn = false, publicKey = null) {
  // TODO: implement opsOn and publicKey
  return smartKeyValues(filepath, keysFilepath).privateKeyValue
}

module.exports = smartPrivateKey
