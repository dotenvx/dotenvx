// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')
const ProKeypair = require('./proKeypair')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath, envKeysFilepath = null) {
  // use path/to/.env.${environment} to generate privateKeyName
  const privateKeyName = guessPrivateKeyName(envFilepath)

  const proKeypairs = new ProKeypair(envFilepath).run() // TODO: implement custom envKeysFilepath
  const keypairs = new Keypair(envFilepath, envKeysFilepath).run()

  return proKeypairs[privateKeyName] || keypairs[privateKeyName]
}

module.exports = { findPrivateKey }
