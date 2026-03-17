const {
  guessKeyNames,
  smartDotenvPublicKey,
  smartDotenvPrivateKey
} = require('./../helpers/keyResolution')
// const Ops = require('./ops')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, opsOn = false) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.opsOn = opsOn
  }

  run () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      // keynames
      const { publicKeyName, privateKeyName } = guessKeyNames(filepath)

      // public key
      const publicKeyValue = smartDotenvPublicKey(filepath)
      out[publicKeyName] = publicKeyValue

      // private key
      let privateKeyValue = null
      if (!privateKeyValue) {
        privateKeyValue = smartDotenvPrivateKey(filepath, this.envKeysFilepath, this.opsOn)
      }

      out[privateKeyName] = privateKeyValue
    }

    return out
  }

  _filepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Keypair
