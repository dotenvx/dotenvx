const Ops = require('../../extensions/ops')

function opsKeypairSync (existingPublicKey) {
  const kp = new Ops().keypair(existingPublicKey)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = opsKeypairSync
