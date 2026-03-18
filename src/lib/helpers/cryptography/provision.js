const mutateSrc = require('./mutateSrc')
const mutateKeysSrc = require('./mutateKeysSrc')
const deriveKeypair = require('./deriveKeypair')
const { keyNames } = require('../keyResolution')

function provision ({ envSrc, envFilepath, keysFilepath }) {
  const { publicKeyName, privateKeyName } = keyNames(envFilepath)
  const { publicKey, privateKey } = deriveKeypair() // TODO: handle derivation from Ops

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
