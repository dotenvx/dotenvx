const { scan, encrypted } = require('@dotenvx/primitives')
const resolveOnePassword = require('./resolveOnePassword')

// Keep source-order expansion semantics, but combine independent inputs.
module.exports = function onePasswordBatch (processEnv, onStatus, sync = false) {
  const rows = []
  let pending = {}
  // Mixed-provider rows must resolve op values before Bitwarden consumes them.
  const mixed = parsed => Object.values(parsed).some(value => typeof value === 'string' && value.startsWith('bw://'))
  const deferred = (parsed, options) => mixed(parsed) ? resolveOnePassword(parsed, options) : { errors: [], unresolved: [] }
  deferred.sync = parsed => mixed(parsed) ? resolveOnePassword.sync(parsed) : { errors: [], unresolved: [] }

  function apply (result, references) {
    const failed = new Set(result.unresolved)
    for (const row of rows) {
      for (const key of result.unresolved) {
        if (row.injected?.[key] === references[key]) {
          row.errors.push(result.errors[result.unresolved.indexOf(key)])
        }
      }
      for (const values of [row.injected, row.parsed, row.existed]) {
        for (const [key, reference] of Object.entries(references)) {
          if (!failed.has(key) && values?.[key] === reference) values[key] = pending[key]
        }
      }
    }
    for (const [key, reference] of Object.entries(references)) {
      if (!failed.has(key) && processEnv[key] === reference) processEnv[key] = pending[key]
    }
    pending = {}
    rows.length = 0
  }

  function flush () {
    if (!Object.keys(pending).length) return
    const references = { ...pending }
    if (sync) {
      apply(resolveOnePassword.sync(pending), references)
    } else {
      return resolveOnePassword(pending, { onStatus }).then(result => apply(result, references))
    }
  }

  function before (src) {
    if (!Object.keys(pending).length) return
    const { parsed } = scan(src)
    // Expansion and command substitution must see resolved earlier values.
    // Encrypted values may contain either, so treat them conservatively.
    if (src.includes('$') || src.includes('bw://') ||
      Object.keys(parsed).some(key => Object.hasOwn(pending, key)) ||
      Object.values(parsed).flat().some(encrypted)) return flush()
  }

  function add (row) {
    if (!row) return
    rows.push(row)
    for (const [key, value] of Object.entries(row.injected || {})) {
      if (typeof value === 'string' && value.startsWith('op://')) pending[key] = value
    }
  }

  return { resolve: deferred, before, add, flush }
}
