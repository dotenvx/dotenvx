const keyNamesForEnvFile = require('./../helpers/keyResolution/keyNamesForEnvFile')
const keyValues = require('./../helpers/keyResolution/keyValues')
const keyValuesSync = require('./../helpers/keyResolution/keyValuesSync')
const armorKeypair = require('./../helpers/cryptography/armorKeypair')
const armorKeypairSync = require('./../helpers/cryptography/armorKeypairSync')

class Keypair {
  constructor (envFile = '.env', envKeysFilepath = null, noArmor = false, options = {}) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.noArmor = noArmor
    this.command = options.command
    this.hostname = options.hostname
    this.token = options.token
    this.team = options.team
    this.metadata = options.metadata
    this.publicKey = options.publicKey
  }

  runSync () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const { publicKeyName, privateKeyName } = keyNamesForEnvFile(filepath)
      let { publicKeyValue, privateKeyValue } = keyValuesSync(filepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command,
        token: this.token,
        publicKey: this.publicKey
      })

      if (this.publicKey && !publicKeyValue) {
        publicKeyValue = this.publicKey
      }

      if (!this.noArmor && this.token && !publicKeyValue && !privateKeyValue) {
        const kp = armorKeypairSync(undefined, {
          envFilepath: filepath,
          command: this.command,
          hostname: this.hostname,
          token: this.token,
          team: this.team,
          metadata: this.metadata
        })
        publicKeyValue = kp.publicKey
        privateKeyValue = kp.privateKey
      } else if (!this.noArmor && publicKeyValue && !privateKeyValue) {
        const kp = armorKeypairSync(publicKeyValue, {
          envFilepath: filepath,
          command: this.command,
          hostname: this.hostname,
          token: this.token,
          team: this.team,
          metadata: this.metadata
        })
        privateKeyValue = kp.privateKey
      }

      out[publicKeyName] = publicKeyValue
      out[privateKeyName] = privateKeyValue
    }

    return out
  }

  async run () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const { publicKeyName, privateKeyName } = keyNamesForEnvFile(filepath)
      let { publicKeyValue, privateKeyValue } = await keyValues(filepath, {
        keysFilepath: this.envKeysFilepath,
        noArmor: this.noArmor,
        command: this.command,
        token: this.token,
        publicKey: this.publicKey
      })

      if (this.publicKey && !publicKeyValue) {
        publicKeyValue = this.publicKey
      }

      if (!this.noArmor && this.token && !publicKeyValue && !privateKeyValue) {
        const kp = await armorKeypair(undefined, {
          envFilepath: filepath,
          command: this.command,
          hostname: this.hostname,
          token: this.token,
          team: this.team,
          metadata: this.metadata
        })
        publicKeyValue = kp.publicKey
        privateKeyValue = kp.privateKey
      } else if (!this.noArmor && publicKeyValue && !privateKeyValue) {
        const kp = await armorKeypair(publicKeyValue, {
          envFilepath: filepath,
          command: this.command,
          hostname: this.hostname,
          token: this.token,
          team: this.team,
          metadata: this.metadata
        })
        privateKeyValue = kp.privateKey
      }

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
