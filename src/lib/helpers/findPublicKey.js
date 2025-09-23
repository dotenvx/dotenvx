// helpers
const guessPublicKeyName = require('./guessPublicKeyName')
const ProKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPublicKey (envFilepath, opsOn = true) {
  const publicKeyName = guessPublicKeyName(envFilepath)

  let proKeypairs = {}
  if (opsOn) {
    proKeypairs = new ProKeypair(envFilepath).run()
  }

  const keypairs = new Keypair(envFilepath).run()

  return proKeypairs[publicKeyName] || keypairs[publicKeyName]
}

module.exports = findPublicKey
