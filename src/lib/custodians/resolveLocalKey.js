const fs = require('node:fs')
const path = require('node:path')
const { scan, derive } = require('@dotenvx/primitives')
const custodians = require('./index')
const keynames = require('../conventions/keynames')
const matchesStoredKey = require('../helpers/matchesStoredKey')
const removeEnvKey = require('../helpers/removeEnvKey')
const Errors = require('../helpers/errors')

function read (filename) {
  try { return fs.readFileSync(filename, 'utf8') } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

function value (src, name) {
  return src === undefined ? undefined : scan(src).scanned[name]?.at(-1)
}

// Return the originating store with the key, so a move only removes that source.
// Never look up Armor itself: these operations upload a locally held private key.
module.exports = async function resolveLocalKey (envFile = '.env', { allowMissing = false, all = false } = {}) {
  const src = read(envFile)
  const { publicKeyName, privateKeyName } = keynames(envFile, src || '')
  let publicKey = value(src, publicKeyName)
  if (allowMissing && !publicKey) {
    if (src === undefined) throw new Errors({ envFilepath: envFile }).missingEnvFile()
    throw new Errors({ key: publicKeyName }).missingKey()
  }

  const sources = []

  async function result (stored, remove, reread, origin) {
    // A file-only push remains supported.
    if (!publicKey) publicKey = derive(stored)
    if (!matchesStoredKey(publicKey, stored)) throw new Error('private key does not match the .env public key')
    const privateKey = stored
    return {
      ...origin,
      publicKey,
      privateKey,
      privateKeyName,
      async remove () {
        if (await reread() !== stored) throw new Error('private key changed during upload; original storage was not modified')
        await remove()
      }
    }
  }

  const files = [...new Set([path.resolve(path.dirname(envFile), '.env.keys'), path.resolve('.env.keys')])]
  for (const filename of files) {
    const stored = value(read(filename), privateKeyName)
    if (stored) {
      const source = await result(stored, () => removeEnvKey(privateKeyName, filename), () => value(read(filename), privateKeyName), { id: 'file', name: path.relative(process.cwd(), filename), filepath: filename })
      if (!all) return source
      sources.push(source)
    }
  }

  if (publicKey) {
    for (const id of ['native', 'onepassword', 'bitwarden']) {
      const custodian = custodians.get(id)
      if (!custodian.enabled() || (custodian.configured && !custodian.configured())) continue
      const stored = (await custodian.get(publicKey))?.[publicKey]
      if (stored) {
        const source = await result(stored, () => custodian.delete(publicKey), async () => (await custodian.get(publicKey))?.[publicKey], { id, name: custodian.name })
        if (!all) return source
        sources.push(source)
      }
    }
  }

  if (all) return sources

  // Up can be repeated for a key already held by Armor; the server verifies it.
  if (allowMissing) return { publicKey, privateKeyName, remove: async () => {} }
  if (!publicKey && src === undefined) throw new Errors({ envFilepath: '.env.keys' }).missingEnvFile()
  throw new Error(`private key ${privateKeyName} not found in .env.keys, OS secret storage, 1Password, or Bitwarden`)
}
