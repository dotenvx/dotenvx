// helpers
const guessPublicKeyName = require('./guessPublicKeyName')
const ProKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPublicKey (envFilepath) {
  const publicKeyName = guessPublicKeyName(envFilepath)

  const proKeypairs = new ProKeypair(envFilepath).run()
  const keypairs = new Keypair(envFilepath).run()

  return proKeypairs[publicKeyName] || keypairs[publicKeyName]
}

module.exports = findPublicKey
