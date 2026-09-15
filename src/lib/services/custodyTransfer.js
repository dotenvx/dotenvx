const { derive } = require('@dotenvx/primitives')
const keynames = require('../conventions/keynames')
const readEnvKey = require('../helpers/readEnvKey')
const removeEnvKey = require('../helpers/removeEnvKey')
const upsertEnvKey = require('../helpers/upsertEnvKey')

function verify (publicKey, privateKey) {
  try {
    if (derive(privateKey) === publicKey) return
  } catch {}
  throw new Error('private key does not match the .env public key')
}

async function custodyTransfer (provider, name, operation, envFile = '.env', envKeysFile = '.env.keys') {
  if (!['up', 'down', 'push', 'pull'].includes(operation)) throw new Error('unknown custody operation')
  const { publicKeyName, privateKeyName } = keynames(envFile)
  const publicKey = readEnvKey(publicKeyName, envFile, { strict: true })
  const result = changed => ({ changed, privateKeyName, publicKeyValue: publicKey })
  const local = readEnvKey(privateKeyName, envKeysFile)
  if (operation === 'up' || operation === 'push') {
    if (local) verify(publicKey, local)
    if (operation === 'push' && !local) throw new Error(`missing ${privateKeyName} in ${envKeysFile}`)
    const existing = (await provider.get(publicKey))[publicKey]
    if (existing) verify(publicKey, existing)
    if (!local && !existing) throw new Error(`missing ${privateKeyName} in ${envKeysFile}`)
    if (!existing) await provider.set(publicKey, local)
    const saved = (await provider.get(publicKey))[publicKey]
    if (!saved || saved !== (local || existing)) throw new Error(`could not verify private key in ${name}; ${envKeysFile} unchanged`)
    if (operation === 'up') return result(removeEnvKey(privateKeyName, envKeysFile).changed || !existing)
    return result(!existing)
  }

  const privateKey = (await provider.get(publicKey))[publicKey]
  if (!privateKey) {
    if (operation === 'down' && local) {
      verify(publicKey, local)
      return result(false)
    }
    throw new Error(`[NOT_FOUND] private key not found in ${name}`)
  }
  verify(publicKey, privateKey)
  const written = upsertEnvKey(privateKeyName, privateKey, envKeysFile)
  if (readEnvKey(privateKeyName, envKeysFile, { strict: true }) !== privateKey) {
    throw new Error(`could not verify private key in ${envKeysFile}; ${name} unchanged`)
  }
  if (operation === 'down') await provider.delete(publicKey)
  return result(written.changed || operation === 'down')
}

module.exports = custodyTransfer
