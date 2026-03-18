const Errors = require('./../errors')
const mutateSrc = require('./mutateSrc')
const deriveKeypair = require('./deriveKeypair')

function provisionWithPrivateKey ({ envSrc, envFilepath, keysFilepath, privateKeyValue, publicKeyValue, publicKeyName }) {
  const kp = deriveKeypair(privateKeyValue)
  const publicKey = kp.publicKey
  const privateKey = kp.privateKey

  // if derivation doesn't match what's in the file (or preset in env)
  if (publicKeyValue && publicKeyValue !== publicKey) {
    throw new Errors({ publicKey, publicKeyExisting: publicKeyValue }).mispairedPrivateKey()
  }

  // scenario when encrypting a monorepo second .env file from a prior generated -fk .env.keys file
  if (!publicKeyValue) {
    const mutated = mutateSrc({ envSrc, envFilepath, keysFilepath, publicKeyName, publicKeyValue: publicKey })
    envSrc = mutated.envSrc
  }

  return {
    envSrc,
    publicKey,
    privateKey
  }
}

module.exports = provisionWithPrivateKey
