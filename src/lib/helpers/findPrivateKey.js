// helpers
const guessPrivateKeyName = require('./guessPrivateKeyName')

// services
const Keypair = require('./../services/keypair')

function findPrivateKey (envFilepath, envKeysFilepath = null, opsOn = false) {
  // use path/to/.env.${environment} to generate privateKeyName
  const privateKeyName = guessPrivateKeyName(envFilepath)

  if (opsOn) {
    // TODO: here remotely fetch for OpsPrivateKey
    // 1. find publicKey via file
    // 2. use as secure lookup to get privateKey
    return null
  } else {
    const keypairs = new Keypair(envFilepath, envKeysFilepath).run()

    return keypairs[privateKeyName]
  }
}

module.exports = { findPrivateKey }
