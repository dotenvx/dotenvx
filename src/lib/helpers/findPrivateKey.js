// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath, envKeysFilepath = null, opsOn = true) {
  // use path/to/.env.${environment} to generate privateKeyName
  const privateKeyName = guessPrivateKeyName(envFilepath)

  if (opsOn) {
    // TODO: here remotely fetch for OpsPrivateKey
  }

  const keypairs = new Keypair(envFilepath, envKeysFilepath).run()

  return keypairs[privateKeyName]
}

module.exports = { findPrivateKey }
