const mutateSrc = require('./mutateSrc')
const mutateKeysSrc = require('./mutateKeysSrc')
const localKeypair = require('./localKeypair')
const { keyNames } = require('../keyResolution')

const Ops = require('../../extensions/ops')

function provision ({ envSrc, envFilepath, keysFilepath, opsOn }) {
  opsOn = opsOn === true
  const { publicKeyName, privateKeyName } = keyNames(envFilepath)

  let publicKey
  let privateKey

  if (opsOn) {
    const kp = new Ops().keypair()
    publicKey = kp['public_key']
    privateKey = kp['private_key']
  } else {
    const kp = localKeypair() // TODO: handle derivation from Ops
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc
  const { keysSrc, envKeysFilepath } = mutateKeysSrc({ envFilepath, keysFilepath, privateKeyName, privateKeyValue: privateKey })

  return {
    envSrc,
    keysSrc,
    publicKey,
    privateKey,
    privateKeyAdded: true,
    envKeysFilepath
  }
}

module.exports = provision
