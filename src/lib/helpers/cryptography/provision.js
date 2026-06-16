const mutateSrc = require('./mutateSrc')
const mutateKeysSrc = require('./mutateKeysSrc')
const armorKeypair = require('./armorKeypair')
const localKeypair = require('./localKeypair')
const { keyNamesForEnvFile } = require('../keyResolution')

async function provision ({ envSrc, envFilepath, keysFilepath, noArmor, token, selectKeyStorage, command }) {
  noArmor = noArmor !== false
  if (!noArmor && selectKeyStorage) {
    noArmor = await selectKeyStorage() !== 'armored'
  }

  const { publicKeyName, privateKeyName } = keyNamesForEnvFile(envFilepath)

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
    const armorOptions = { token, envFilepath, command }
    const kp = await armorKeypair(undefined, armorOptions)
    publicKey = kp.publicKey
    privateKey = kp.privateKey
  }

  const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
  envSrc = mutated.envSrc

  if (noArmor) {
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
