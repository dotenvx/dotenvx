// helpers
const guessPrivateKeyName = require('./keyResolution/guessPrivateKeyName')
const findPublicKey = require('./findPublicKey')

// services
const Keypair = require('./../services/keypair')
const Ops = require('./../services/ops')

function findPrivateKey (envFilepath, envKeysFilepath = null, opsOn = false, publicKey = null) {
  // use path/to/.env.${environment} to generate privateKeyName
  const privateKeyName = guessPrivateKeyName(envFilepath)

  // Why is this needed? didn't keypair handle this for us prior?
  // prefer explicitly-set machine env key first
  // const processEnvPrivateKey = process.env[privateKeyName]
  // if (processEnvPrivateKey && processEnvPrivateKey.length > 0) {
  //   return processEnvPrivateKey
  // }

  // if (opsOn) {
  //   const resolvedPublicKey = publicKey || findPublicKey(envFilepath)
  //   const opsPrivateKey = new Ops().keypair(resolvedPublicKey)
  //   if (opsPrivateKey) {
  //     return opsPrivateKey
  //   }
  // }

  const keypairs = new Keypair(envFilepath, envKeysFilepath).run()
  return keypairs[privateKeyName]
}

module.exports = { findPrivateKey }
