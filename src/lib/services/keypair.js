const keyNames = require('./../helpers/keyResolution/keyNames')
const smartKeyValues = require('./../helpers/keyResolution/smartKeyValues')

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
      const { publicKeyName, privateKeyName } = keyNames(filepath)
      const { publicKeyValue, privateKeyValue } = smartKeyValues(filepath, this.envKeysFilepath)

      out[publicKeyName] = publicKeyValue
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
