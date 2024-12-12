// helpers
const guessPublicKeyName = require('./guessPublicKeyName')
const proKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPublicKey (envFilepath) {
  const publicKeyName = guessPublicKeyName(envFilepath)
  const proKeypairs = proKeypair(envFilepath)
  return proKeypairs[publicKeyName] || new Keypair(envFilepath, publicKeyName).run()
}

module.exports = findPublicKey
