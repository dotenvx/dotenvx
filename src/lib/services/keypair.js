const guessPublicKeyName = require('./../helpers/keyResolution/guessPublicKeyName')
const guessPrivateKeyName = require('./../helpers/keyResolution/guessPrivateKeyName')
const smartDotenvPublicKey = require('./../helpers/smartDotenvPublicKey')
const smartDotenvPrivateKey = require('./../helpers/smartDotenvPrivateKey')
const Ops = require('./ops')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, opsOn = false) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.opsOn = opsOn
  }

  run () {
    const out = {}

    const envFilepaths = this._envFilepaths()
    for (const envFilepath of envFilepaths) {
      // public key
      const publicKeyName = guessPublicKeyName(envFilepath)
      const publicKeyValue = smartDotenvPublicKey(envFilepath)
      out[publicKeyName] = publicKeyValue

      // private key
      const privateKeyName = guessPrivateKeyName(envFilepath)
      let privateKeyValue = null

      if (!privateKeyValue) {
        privateKeyValue = smartDotenvPrivateKey(envFilepath, this.envKeysFilepath, this.opsOn)
      }

      out[privateKeyName] = privateKeyValue
    }

    return out
  }

  _envFilepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Keypair
