const keyValues = require('./keyValues')

function privateKeyValue (filepath, keysFilepath = null, opsOn = false, publicKey = null) {
  // TODO: implement opsOn and publicKey
  return keyValues(filepath, keysFilepath).privateKeyValue
}

module.exports = privateKeyValue
