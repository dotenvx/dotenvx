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
  const processEnv = options.processEnv || process.env

  for (const filepath of filepaths(options.envFile)) {
    const src = await fsx.readFileX(filepath)
    const publicKey = publickeys(src)[0]

    const keyringOptions = buildOptions({
      publicKey,
      processEnv,
      fk: options.envKeysFilepath || options.envKeysFile || path.resolve(path.dirname(filepath), '.env.keys')
    })

    const provider = await providers(options)
    keyringOptions.provider = provider

    const ring = await keyring(keyringOptions)

    outputKeypair({ out, filepath, publicKey, ring })
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
    const provider = providers.sync(options)
    keyringOptions.provider = provider

    const ring = keyringSync(keyringOptions)

    outputKeypair({ out, filepath, publicKey, ring })
  }

  return out
}

module.exports = keypair
module.exports.sync = keypairSync
