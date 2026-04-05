const Ops = require('../../extensions/ops')

async function opsKeypair (existingPublicKey) {
  const kp = await new Ops().keypair(existingPublicKey)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = opsKeypair
