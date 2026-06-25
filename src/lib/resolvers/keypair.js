const fsx = require('./../helpers/fsx')
const path = require('path')
const keynames = require('./../conventions/keynames')

const { keyring, keyringSync, publickeys } = require('@dotenvx/primitives')
const armorProvider = require('./../providers/armor/index')

function filepaths (envFile = '.env') {
  if (!Array.isArray(envFile)) {
    return [envFile]
  }

  return envFile
}

function providerSync (publicKeyHex) {
  const { createSyncFn } = require('synckit')
  const runProviderSync = createSyncFn(require.resolve('./../providers/worker.js'))
  return runProviderSync(require.resolve('./../providers/armor/index'), publicKeyHex)
}

function initialRing (publicKey) {
  const ring = {}
  if (publicKey) {
    ring[publicKey] = ''
  }
  return ring
}

function keyringOptions ({ filepath, publicKey, processEnv, envKeysFilepath, noArmor, provider }) {
  const options = {
    processEnv,
    fk: envKeysFilepath || path.resolve(path.dirname(filepath), '.env.keys'),
    ring: initialRing(publicKey)
  }
  if (noArmor) {
    options.provider = null
  } else {
    options.provider = provider
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
  const noArmor = options.noArmor || false

  for (const filepath of filepaths(options.envFile)) {
    const src = await fsx.readFileX(filepath)
    const publicKey = publickeys(src)[0]
    const ring = await keyring(keyringOptions({
      filepath,
      publicKey,
      processEnv,
      envKeysFilepath: options.envKeysFilepath,
      noArmor,
      provider: (publicKeyHex) => armorProvider(publicKeyHex, {
        onStatus: options.onStatus
      })
    }))

    outputKeypair({ out, filepath, publicKey, ring })
  }

  return out
}

function keypairSync (options = {}) {
  const out = {}
  const processEnv = options.processEnv || process.env
  const noArmor = options.noArmor || false

  for (const filepath of filepaths(options.envFile)) {
    const src = fsx.readFileXSync(filepath)
    const publicKey = publickeys(src)[0]
    const ring = keyringSync(keyringOptions({
      filepath,
      publicKey,
      processEnv,
      envKeysFilepath: options.envKeysFilepath,
      noArmor,
      provider: providerSync
    }))

    outputKeypair({ out, filepath, publicKey, ring })
  }

  return out
}

module.exports = keypair
module.exports.sync = keypairSync
