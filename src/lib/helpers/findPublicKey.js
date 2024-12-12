// helpers
const guessPublicKeyName = require('./guessPublicKeyName')
const ProKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPublicKey (envFilepath) {
  const publicKeyName = guessPublicKeyName(envFilepath)
  const proKeypairs = new ProKeypair(envFilepath).run()
  return proKeypairs[publicKeyName] || new Keypair(envFilepath, publicKeyName).run()
}

module.exports = findPublicKey
