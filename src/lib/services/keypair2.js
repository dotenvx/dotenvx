const fs = require('fs')
const path = require('path')
const { createSyncFn } = require('synckit')
const { keyring, publickeys } = require('@dotenvx/primitives')
const keynames = require('./../conventions/keynames')
const runProvider = createSyncFn(require.resolve('./../providers/worker'))

function readSrc (filepath) {
  try {
    return fs.readFileSync(filepath, 'utf8')
  } catch (_e) {
    return ''
  }
}

class Keypair2 {
  constructor (envFile = '.env', envKeysFilepath = null, options = {}) {
    this.envFile = envFile
    this.envKeysFilepath = envKeysFilepath
    this.processEnv = options.processEnv || process.env
    this.token = options.token
    this.hostname = options.hostname
  }

  provider (publicKeyHex) {
    return runProvider(require.resolve('./../providers/armor/index'), publicKeyHex)
  }

  runSync () {
    const out = {}

    for (const filepath of this._filepaths()) {
      const src = readSrc(filepath)
      const { publicKeyName, privateKeyName } = keynames(filepath, src)
      const publicKey = publickeys(src)[0] // edge case: if user placed two DOTENV_PUBLIC_KEY*. not a convention so [0] here reasonably safe.
      const ring = {}

      if (publicKey) {
        ring[publicKey] = ''
      }

      const keysFilepath = this.envKeysFilepath || path.resolve(path.dirname(filepath), '.env.keys')
      const resolvedRing = keyring({
        processEnv: this.processEnv,
        fk: keysFilepath,
        ring,
        provider: this.provider
      })

      out[publicKeyName] = publicKey || null
      out[privateKeyName] = publicKey ? resolvedRing[publicKey] || null : null
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

module.exports = Keypair2
