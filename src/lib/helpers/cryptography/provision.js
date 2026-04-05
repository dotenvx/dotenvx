const mutateSrc = require('./mutateSrc')
const mutateKeysSrc = require('./mutateKeysSrc')
const opsKeypair = require('./opsKeypair')
const localKeypair = require('./localKeypair')
const { keyNames } = require('../keyResolution')

async function provision ({ envSrc, envFilepath, keysFilepath, noOps }) {
  noOps = noOps !== false
  const { publicKeyName, privateKeyName } = keyNames(envFilepath)

  let publicKey
  let privateKey
  let keysSrc
  let envKeysFilepath
  let privateKeyAdded = false

  if (noOps) {
    const kp = localKeypair()
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  } else {
    const kp = await opsKeypair()
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc

  if (noOps) {
    const mutated = await mutateKeysSrc({ envFilepath, keysFilepath, privateKeyName, privateKeyValue: privateKey })
    keysSrc = mutated.keysSrc
    envKeysFilepath = mutated.envKeysFilepath
    privateKeyAdded = true
  }

  return {
    envSrc,
    keysSrc,
    publicKey,
    privateKey,
    privateKeyAdded,
    envKeysFilepath
  }
}

module.exports = provision
