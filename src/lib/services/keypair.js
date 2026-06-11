const {
  keyNames,
  keyValues,
  keyValuesSync
} = require('./../helpers/keyResolution')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, noArmor = false, options = {}) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.command = options.command
  }

  runSync () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const { publicKeyName, privateKeyName } = keyNames(filepath)
      const { publicKeyValue, privateKeyValue } = keyValuesSync(filepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command
      })

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
      const { publicKeyValue, privateKeyValue } = await keyValues(filepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command
      })

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
