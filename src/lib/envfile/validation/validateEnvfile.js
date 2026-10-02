const { check } = require('@dotenvx/primitives')
const encryptedSources = require('./encryptedSources')
const Errors = require('../../helpers/errors')

module.exports = function validateEnvfile (schema, env, processedEnvs, onKey, { validateEncryption = true } = {}) {
  const diagnostics = check(schema, env, {
    loadedKeys: new Set((processedEnvs || []).flatMap(row => [...Object.keys(row.injected || {}), ...Object.keys(row.existed || {})])),
    encryptedKeys: encryptedSources(processedEnvs),
    validateEncryption,
    onKey
  })
  if (diagnostics.length === 0) return
  const error = new Errors({ message: diagnostics.map(diagnostic => diagnostic.message).join('; ') }).invalidEnv()
  error.diagnostics = diagnostics
  return error
}
