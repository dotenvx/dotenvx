const Ops = require('../../extensions/ops')

function opsKeypairSync (existingPublicKey, options = {}) {
  const ops = new Ops()
  const kp = Object.keys(options).length > 0 ? ops.keypairSync(existingPublicKey, options) : ops.keypairSync(existingPublicKey)
  const publicKey = kp.public_key
  const privateKey = kp.private_key

  return {
    publicKey,
    privateKey
  }
}

module.exports = opsKeypairSync
