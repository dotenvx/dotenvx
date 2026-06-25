const fsx = require('./../helpers/fsx')
const path = require('path')
const keynames = require('./../conventions/keynames')

const { createSyncFn } = require('synckit')
const { keyring, publickeys } = require('@dotenvx/primitives')
const runProvider = createSyncFn(require.resolve('./../providers/worker'))
function provider (publicKeyHex) {
  return runProvider(require.resolve('./../providers/armor/index'), publicKeyHex)
}

class Keypair {
  constructor (options = {}) {
    this.envFile = options.envFile || '.env'
    this.envKeysFilepath = options.envKeysFilepath
    this.processEnv = options.processEnv || process.env
    this.noArmor = options.noArmor || false
    this.command = options.command
  }

  runSync () {
    const out = {}

    const filepaths = this._filepaths()
    for (const filepath of filepaths) {
      const src = fsx.readFileXSync(filepath)
      const { publicKeyName, privateKeyName } = keynames(filepath)
      const publicKey = publickeys(src)[0] // edge case: if user placed two DOTENV_PUBLIC_KEY*. not a convention so [0] here reasonably safe.
      let ring = {}
      if (publicKey) {
        ring[publicKey] = ''
      }
      ring = keyring({
        processEnv: this.processEnv,
        fk: this.envKeysFilepath || path.resolve(path.dirname(filepath), '.env.keys'),
        ring,
        provider: this.noArmor ? null : provider
      })

      out[publicKeyName] = publicKey || null
      out[privateKeyName] = publicKey ? ring[publicKey] || null : null
    }

    return out
  }

  async run () {
    return this.runSync()
  }

  _filepaths () {
    if (!Array.isArray(this.envFile)) {
      return [this.envFile]
    }

    return this.envFile
  }
}

module.exports = Keypair
