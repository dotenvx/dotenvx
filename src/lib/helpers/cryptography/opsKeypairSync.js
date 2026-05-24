const Ops = require('../../extensions/ops')

function opsKeypairSync (existingPublicKey, options = {}) {
  const kp = new Ops().keypairSync(existingPublicKey, options)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = opsKeypairSync
