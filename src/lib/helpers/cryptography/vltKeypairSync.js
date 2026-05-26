const Vlt = require('../../extensions/vlt')

function vltKeypairSync (existingPublicKey, options = {}) {
  const kp = new Vlt().keypairSync(existingPublicKey, options)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = vltKeypairSync
