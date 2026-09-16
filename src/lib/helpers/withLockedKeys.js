const fs = require('fs')
const { scan } = require('@dotenvx/primitives')
const protection = require('../custodians/lock')

// Primitives already resolve raw file/environment keys first. This provider
// supplies locked keys only when the requested private key is still missing.
function withLockedKeys (options, sync = false) {
  const candidates = []
  const paths = Array.isArray(options.fk) ? options.fk : [options.fk || '.env.keys']
  for (const filepath of paths) {
    let src
    try { src = fs.readFileSync(filepath, 'utf8') } catch { continue }
    for (const [name, values] of Object.entries(scan(src).parsed)) {
      if (name.startsWith('DOTENV_PRIVATE_KEY')) candidates.push(...values.flatMap(value => value.split(',')))
    }
  }
  // Environment assignments take precedence over key files.
  for (const [name, value] of Object.entries(options.processEnv || process.env)) {
    if (name.startsWith('DOTENV_PRIVATE_KEY') && typeof value === 'string') candidates.push(...value.split(','))
  }
  if (!candidates.some(value => value.startsWith('locked:'))) return options
  candidates.reverse()
  function find (publicKey) {
    return candidates.find(value => value.startsWith(`locked:${publicKey}:`))
  }
  const provider = options.provider
  return {
    ...options,
    provider: sync
      ? publicKey => {
        const value = find(publicKey)
        return value ? protection.unlockSync(publicKey, { [publicKey]: value }, options) : (provider ? provider(publicKey) : {})
      }
      : async publicKey => {
        const value = find(publicKey)
        return value ? protection.unlock(publicKey, { [publicKey]: value }, options) : (provider ? provider(publicKey) : {})
      }
  }
}

module.exports = withLockedKeys
