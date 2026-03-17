const smartKeyValues = require('./smartKeyValues')

function smartPrivateKey (filepath, keysFilepath = null) {
  return smartKeyValues(filepath, keysFilepath).privateKeyValue
}

module.exports = smartPrivateKey
