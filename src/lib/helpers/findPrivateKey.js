// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')
const proKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath) {
  const privateKeyName = guessPrivateKeyName(envFilepath)
  const proKeypairs = proKeypair(envFilepath)

  return proKeypair[privateKeyName] || new Keypair(envFilepath, privateKeyName).run()
}

module.exports = findPrivateKey
