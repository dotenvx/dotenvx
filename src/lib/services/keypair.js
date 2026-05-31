const {
  keyNames,
  keyValues,
  keyValuesSync
} = require('./../helpers/keyResolution')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, noArmor = false) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
  }

  runSync () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const { publicKeyName, privateKeyName } = keyNames(filepath)
      const { publicKeyValue, privateKeyValue } = keyValuesSync(filepath, { keysFilepath: this.envKeysFilepath, noArmor: this.noArmor })

      out[publicKeyName] = publicKeyValue
      out[privateKeyName] = privateKeyValue
    }

    return out
  }

  async run () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const { publicKeyName, privateKeyName } = keyNames(filepath)
      const { publicKeyValue, privateKeyValue } = await keyValues(filepath, { keysFilepath: this.envKeysFilepath, noArmor: this.noArmor })

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
