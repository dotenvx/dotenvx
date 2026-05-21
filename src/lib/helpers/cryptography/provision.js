const mutateSrc = require('./mutateSrc')
const mutateKeysSrc = require('./mutateKeysSrc')
const opsKeypair = require('./opsKeypair')
const localKeypair = require('./localKeypair')
const { keyNames } = require('../keyResolution')

async function provision ({ envSrc, envFilepath, keysFilepath, noOps, token, keypairHooks, selectKeyStorage }) {
  noOps = noOps !== false
  if (!noOps && selectKeyStorage) {
    noOps = await selectKeyStorage() !== 'armored'
  }

  const { publicKeyName, privateKeyName } = keyNames(envFilepath)

  let publicKey
  let privateKey
  let keysSrc
  let envKeysFilepath
  let localPrivateKeyAdded = false
  let remotePrivateKeyAdded = false

  if (noOps) {
    const kp = localKeypair()
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  } else {
    const keypairOptions = {}
    if (token) keypairOptions.token = token
    if (keypairHooks) keypairOptions.hooks = keypairHooks
    const kp = await opsKeypair(undefined, keypairOptions)
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc

  if (noOps) {
    const mutated = await mutateKeysSrc({ envFilepath, keysFilepath, privateKeyName, privateKeyValue: privateKey })
    keysSrc = mutated.keysSrc
    envKeysFilepath = mutated.envKeysFilepath
    localPrivateKeyAdded = true
  } else {
    remotePrivateKeyAdded = true
  }

  return {
    envSrc,
    keysSrc,
    publicKey,
    privateKey,
    envKeysFilepath,
    localPrivateKeyAdded,
    remotePrivateKeyAdded
  }
}

module.exports = provision
