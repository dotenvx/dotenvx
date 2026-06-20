const { derive, keypair } = require('@dotenvx/primitives')

function localKeypair (existingPrivateKey) {
  if (existingPrivateKey) {
    return {
      publicKey: derive(existingPrivateKey),
      privateKey: existingPrivateKey
    }
  }

  return keypair()
}

module.exports = localKeypair
