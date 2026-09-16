const protection = require('./lock')

// Explicit registration keeps bundling predictable and avoids executing
// arbitrary modules discovered in a project's working directory.
const builtins = [
  require('./local/native'),
  require('./local/onepassword'),
  require('./local/bitwarden'),
  require('./local/file'),
  require('./managed/armor')
]

function createRegistry (custodians) {
  const entries = new Map()
  for (const custodian of custodians) {
    if (!custodian || typeof custodian.id !== 'string' || !custodian.id || entries.has(custodian.id)) {
      throw new Error('custodians must have unique, nonempty ids')
    }
    for (const method of ['enabled', 'available', 'store']) {
      if (typeof custodian[method] !== 'function') throw new Error(`custodian ${custodian.id} requires ${method}()`)
    }
    entries.set(custodian.id, custodian)
  }

  function get (id) {
    const custodian = entries.get(id)
    if (!custodian) throw new Error(`unknown custodian: ${id}`)
    return custodian
  }

  return {
    get,
    async choices (options = {}, custody = 'local') {
      const choices = []
      for (const custodian of entries.values()) {
        if ((custodian.custody || 'local') !== custody) continue
        choices.push({ name: custodian.name, value: custodian.id, disabled: !custodian.enabled(options) || !await custodian.available() })
      }
      return choices
    },
    providers (options = {}, sync = false) {
      const providers = []
      for (const custodian of entries.values()) {
        if (custodian.custody === 'managed') continue
        const method = sync ? 'getSync' : 'get'
        if (!custodian.enabled(options) || !custodian.get || (custodian.configured && !custodian.configured())) continue
        if (typeof custodian[method] !== 'function') throw new Error(`custodian ${custodian.id} does not support synchronous reads`)
        if (sync) {
          providers.push(publicKey => protection.unlockSync(publicKey, custodian[method](publicKey), options))
        } else {
          providers.push(async publicKey => protection.unlock(publicKey, await custodian[method](publicKey), options))
        }
      }
      return providers
    },
    async store (selection, publicKey, privateKey, context = {}) {
      const { id, lock = false } = typeof selection === 'string' ? { id: selection } : selection
      const custodian = get(id)
      if (lock) {
        if (custodian.custody === 'managed') throw new Error('password locking is only supported for local custody')
        privateKey = await protection.lock(publicKey, privateKey, context)
      }
      const result = await custodian.store(publicKey, privateKey, context) || {}
      // Only the native custodian's unavailable-write path requests fallback.
      // Authentication and verification errors propagate without writing a file.
      if (result.fallback) return get(result.fallback).store(publicKey, privateKey, context)
      return result
    }
  }
}

module.exports = createRegistry(builtins)
module.exports.createRegistry = createRegistry
