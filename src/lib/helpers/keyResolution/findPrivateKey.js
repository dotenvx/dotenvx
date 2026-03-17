const guessKeyNames = require('./guessKeyNames')
const readProcessEnvKey = require('./readProcessEnvKey')
const smartDotenvPrivateKey = require('./smartDotenvPrivateKey')
const findPublicKey = require('./findPublicKey')

const Ops = require('./../../services/ops')

function findPrivateKey (envFilepath, envKeysFilepath = null, opsOn = false, publicKey = null) {
  const { privateKeyName } = guessKeyNames(envFilepath)

  // prefer explicitly-set machine env key first
  const processEnvPrivateKey = readProcessEnvKey(privateKeyName)
  if (processEnvPrivateKey) {
    return processEnvPrivateKey
  }

  if (opsOn) {
    const resolvedPublicKey = publicKey || findPublicKey(envFilepath)
    const opsPrivateKey = new Ops().keypair(resolvedPublicKey)
    if (opsPrivateKey) {
      return opsPrivateKey
    }
  }

  return smartDotenvPrivateKey(envFilepath, envKeysFilepath, opsOn)
}

module.exports = { findPrivateKey }
