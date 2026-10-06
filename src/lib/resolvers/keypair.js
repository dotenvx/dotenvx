const { file } = require('@dotenvx/providers')
const fsx = require('./../helpers/fsx')
const path = require('path')
const keynames = require('./../conventions/keynames')
const filepaths = require('./../conventions/filepaths')

const { keyring, keyringSync, publickeys } = require('@dotenvx/primitives')
const providers = require('./../providers')

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

function outputKeypair ({ out, filepath, publicKey, ring }) {
  const { publicKeyName, privateKeyName } = keynames(filepath)

  out[publicKeyName] = publicKey || null
  out[privateKeyName] = publicKey ? ring[publicKey] || null : null
}

async function keypair (options = {}) {
  const out = {}
  const origins = {}
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
    const provider = await providers({ ...options, onProvider: name => { origin = name } })
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

    const ring = await keyring(keyringOptions)

    outputKeypair({ out, filepath, publicKey, ring })
    origins[filepath] = publicKey && ring[publicKey] ? origin : null
  }

  if (options.includeProvider) {
    const names = Object.keys(origins)
    out.provider = names.length === 1 ? origins[names[0]] : origins
  }
  return out
}

function keypairSync (options = {}) {
  const out = {}
  const origins = {}
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
    const provider = providers.sync({ ...options, onProvider: name => { origin = name } })
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

    const ring = keyringSync(keyringOptions)

    outputKeypair({ out, filepath, publicKey, ring })
    origins[filepath] = publicKey && ring[publicKey] ? origin : null
  }

  if (options.includeProvider) {
    const names = Object.keys(origins)
    out.provider = names.length === 1 ? origins[names[0]] : origins
  }
  return out
}

module.exports = keypair
module.exports.sync = keypairSync
