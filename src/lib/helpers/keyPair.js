const { PrivateKey } = require('eciesjs')

function keyPair () {
  const kp = new PrivateKey()

  const publicKey = kp.publicKey.toHex()
  const privateKey = kp.secret.toString('hex')

  return {
    publicKey,
    privateKey
  }
}

module.exports = keyPair
