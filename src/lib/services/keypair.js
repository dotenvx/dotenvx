const guessKeyNames = require('./../helpers/keyResolution/guessKeyNames')
const smartPublicKey = require('./../helpers/keyResolution/smartPublicKey')
const smartPrivateKey = require('./../helpers/keyResolution/smartPrivateKey')
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
      const publicKeyValue = smartPublicKey(filepath)
      out[publicKeyName] = publicKeyValue

      // private key
      let privateKeyValue = null
      if (!privateKeyValue) {
        privateKeyValue = smartPrivateKey(filepath, this.envKeysFilepath, this.opsOn)
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
