const guessPublicKeyName = require('./../helpers/guessPublicKeyName')
const smartDotenvPublicKey = require('./../helpers/smartDotenvPublicKey')
const guessPrivateKeyName = require('./../helpers/guessPrivateKeyName')
const smartDotenvPrivateKey = require('./../helpers/smartDotenvPrivateKey')
const Ops = require('./ops')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, opsOn = true) {
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

      if (this.opsOn) {
        privateKeyValue = new Ops().keypair(publicKeyValue)
      }

      if (!privateKeyValue) {
        privateKeyValue = smartDotenvPrivateKey(envFilepath, this.envKeysFilepath)
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
