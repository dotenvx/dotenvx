const { file } = require('@dotenvx/providers')
const fsx = require('./../helpers/fsx')
const path = require('path')
const keynames = require('./../conventions/keynames')
const filepaths = require('./../conventions/filepaths')

const { keyring, keyringSync, publickeys } = require('@dotenvx/primitives')
const providers = require('./../providers')
const enclavedHint = require('../helpers/enclavedHint')

function buildOptions ({ publicKey, processEnv, fk }) {
  const ring = {}
  if (publicKey) {
    ring[publicKey] = ''
  }

  const options = {
    processEnv,
    fk,
    ring
  }

  return options
}

function appendKeyValue (out, name, value) {
  out[name] = [out[name], value].filter(Boolean).join(',') || null
}

function outputKeypair ({ out, filepath, src, publicKey, ring, custody }) {
  const { publicKeyName, privateKeyName, keyCustodyName } = keynames(filepath, src)

  appendKeyValue(out, publicKeyName, publicKey)
  appendKeyValue(out, privateKeyName, publicKey ? ring[publicKey] : null)
  appendKeyValue(out, keyCustodyName, custody)
}

async function keypair (options = {}) {
  const out = {}
  const processEnv = options.processEnv || process.env

  for (const filepath of filepaths(options.envFile)) {
    const src = await fsx.readFileX(filepath)
    const publicKey = publickeys(src)[0]

    const keyringOptions = buildOptions({
      publicKey,
      processEnv,
      fk: options.envKeysFilepath || options.envKeysFile || path.resolve(path.dirname(filepath), '.env.keys')
    })

    let origin = 'environment'
    let confirmedProvider = false
    const provider = await providers({ ...options, onProvider: name => { origin = name; confirmedProvider = true } })
    const keys = file({ fk: keyringOptions.fk })
    keyringOptions.provider = async publicKey => {
      const ring = await keys.get(publicKey)
      if (ring[publicKey]) {
        origin = '.env.keys'
        return ring
      }
      origin = 'custom'
      return provider ? provider(publicKey) : {}
    }
    if (publicKey) keyringOptions.fk = []

    let ring
    try {
      ring = await keyring(keyringOptions)
    } catch (error) {
      enclavedHint(error, filepath)
      if (!options.onError) throw error
      options.onError(error)
      ring = {}
    }

    const custody = publicKey && (ring[publicKey] || confirmedProvider) ? origin : null
    outputKeypair({ out, filepath, src, publicKey, ring, custody })
  }

  return out
}

function keypairSync (options = {}) {
  const out = {}
  const processEnv = options.processEnv || process.env

  for (const filepath of filepaths(options.envFile)) {
    const src = fsx.readFileXSync(filepath)
    const publicKey = publickeys(src)[0]

    const keyringOptions = buildOptions({
      publicKey,
      processEnv,
      fk: options.envKeysFilepath || options.envKeysFile || path.resolve(path.dirname(filepath), '.env.keys')
    })
    let origin = 'environment'
    let confirmedProvider = false
    const provider = providers.sync({ ...options, onProvider: name => { origin = name; confirmedProvider = true } })
    const keys = file({ fk: keyringOptions.fk })
    keyringOptions.provider = publicKey => {
      const ring = keys.getSync(publicKey)
      if (ring[publicKey]) {
        origin = '.env.keys'
        return ring
      }
      origin = 'custom'
      return provider ? provider(publicKey) : {}
    }
    if (publicKey) keyringOptions.fk = []

    let ring
    try {
      ring = keyringSync(keyringOptions)
    } catch (error) {
      enclavedHint(error, filepath)
      if (!options.onError) throw error
      options.onError(error)
      ring = {}
    }

    const custody = publicKey && (ring[publicKey] || confirmedProvider) ? origin : null
    outputKeypair({ out, filepath, src, publicKey, ring, custody })
  }

  return out
}

module.exports = keypair
module.exports.sync = keypairSync
