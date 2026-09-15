const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')
const removeEnvKey = require('../helpers/removeEnvKey')
const armoredKeyDisplay = require('../helpers/armoredKeyDisplay')
const nativeProvider = require('../providers/native')

class KeychainUp {
  constructor (envFile = '.env', envKeysFile = '.env.keys') {
    this.envFile = envFile
    this.envKeysFile = envKeysFile
  }

  run () {
    const envFile = this.envFile
    const envKeysFile = this.envKeysFile

    const {
      publicKeyName,
      privateKeyName
    } = keynames(envFile)

    const publicKey = readEnvKey(publicKeyName, envFile, { strict: true, ignore: ['MISSING_PRIVATE_KEY'] })
    const label = `dotenvx (${armoredKeyDisplay(publicKey)})`
    let existingPrivateKey

    try {
      existingPrivateKey = nativeProvider.get(publicKey)
    } catch {}

    const privateKey = readEnvKey(privateKeyName, envKeysFile, { strict: !existingPrivateKey })

    if (existingPrivateKey) {
      if (!privateKey) {
        return {
          changed: false,
          label,
          privateKeyName,
          privateKeyValue: existingPrivateKey,
          publicKeyValue: publicKey
        }
      }

      if (existingPrivateKey === privateKey) {
        const result = removeEnvKey(privateKeyName, envKeysFile)

        return {
          changed: result.changed,
          label,
          privateKeyName,
          privateKeyValue: privateKey,
          publicKeyValue: publicKey
        }
      }
    }

    nativeProvider.set(publicKey, privateKey, label)
    if (nativeProvider.get(publicKey) !== privateKey) {
      throw new Error('could not verify private key in OS secret store; .env.keys unchanged')
    }
    removeEnvKey(privateKeyName, envKeysFile)

    return {
      changed: true,
      label,
      privateKeyName,
      privateKeyValue: privateKey,
      publicKeyValue: publicKey
    }
  }
}

module.exports = KeychainUp
