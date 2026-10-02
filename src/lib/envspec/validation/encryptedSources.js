const { scan, encrypted } = require('@dotenvx/primitives')

// Follow actual injection order, so shell overrides and --overload retain their semantics.
module.exports = function encryptedSources (processedEnvs) {
  const keys = new Set()
  for (const row of processedEnvs || []) {
    const { parsed } = scan(row.src || row.string || '')
    for (const [key, value] of Object.entries(row.injected || {})) {
      const original = parsed[key]?.at(-1)
      if (encrypted(original) && !encrypted(value)) keys.add(key)
      else keys.delete(key)
    }
  }
  return keys
}
