// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')
const ProKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath) {
  const privateKeyName = guessPrivateKeyName(envFilepath)
  const proKeypairs = new ProKeypair(envFilepath).run()
  return proKeypairs[privateKeyName] || new Keypair(envFilepath, privateKeyName).run()
}

module.exports = findPrivateKey
