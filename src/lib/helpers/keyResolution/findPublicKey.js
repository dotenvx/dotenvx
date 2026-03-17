const smartDotenvPublicKey = require('./smartDotenvPublicKey')

function findPublicKey (envFilepath) {
  return smartDotenvPublicKey(envFilepath)
}

module.exports = findPublicKey
