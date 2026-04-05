const mutateSrc = require('./mutateSrc')
const mutateKeysSrcSync = require('./mutateKeysSrcSync')
const opsKeypairSync = require('./opsKeypairSync')
const localKeypair = require('./localKeypair')
const { keyNames } = require('../keyResolution')

function provisionSync ({ envSrc, envFilepath, keysFilepath, noOps }) {
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
    const kp = opsKeypairSync()
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc

  if (noOps) {
    const mutated = mutateKeysSrcSync({ envFilepath, keysFilepath, privateKeyName, privateKeyValue: privateKey })
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

module.exports = provisionSync
