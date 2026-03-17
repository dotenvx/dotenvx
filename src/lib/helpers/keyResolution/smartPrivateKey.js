const keyValues = require('./keyValues')

function smartPrivateKey (filepath, keysFilepath = null, opsOn = false, publicKey = null) {
  // TODO: implement opsOn and publicKey
  return keyValues(filepath, keysFilepath).privateKeyValue
}

module.exports = smartPrivateKey
