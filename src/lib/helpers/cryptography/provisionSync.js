const mutateSrc = require('./mutateSrc')
const mutateKeysSrcSync = require('./mutateKeysSrcSync')
const armorKeypairSync = require('./armorKeypairSync')
const localKeypair = require('./localKeypair')
const { keyNames } = require('../keyResolution')

function provisionSync ({ envSrc, envFilepath, keysFilepath, noArmor }) {
  noArmor = noArmor !== false
  const { publicKeyName, privateKeyName } = keyNames(envFilepath)

  let publicKey
  let privateKey
  let keysSrc
  let envKeysFilepath
  let localPrivateKeyAdded = false
  let remotePrivateKeyAdded = false

  if (noArmor) {
    const kp = localKeypair()
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  } else {
    const kp = armorKeypairSync(undefined, { envFilepath })
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc

  if (noArmor) {
    const mutated = mutateKeysSrcSync({ envFilepath, keysFilepath, privateKeyName, privateKeyValue: privateKey })
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

module.exports = provisionSync
