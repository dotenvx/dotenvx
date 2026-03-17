const smartPublicKey = require('./smartPublicKey')

function findPublicKey (envFilepath) {
  return smartPublicKey(envFilepath)
}

module.exports = findPublicKey
