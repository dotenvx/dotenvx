const path = require('path')
const { PrivateKey } = require('eciesjs')

const formatPublicKey = require('./formatPublicKey')
const formatPrivateKey = require('./formatPrivateKey')

function keyPair (envFilepath) {
  const filename = path.basename(envFilepath)

  const kp = new PrivateKey()

  const publicKey = formatPublicKey(kp.publicKey.toHex(), filename)
  const privateKey = formatPrivateKey(kp.secret.toString('hex'), filename)

  return {
    publicKey,
    privateKey
  }
}

module.exports = keyPair
