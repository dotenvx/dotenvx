const { envfile } = require('@dotenvx/primitives')
const Errors = require('../../helpers/errors')

module.exports = function validateEnvspec (schema, env, processedEnvs, onKey, { validateEncryption = true } = {}) {
  const diagnostics = envfile.check(schema, env, {
    loadedKeys: new Set((processedEnvs || []).flatMap(row => [...Object.keys(row.injected || {}), ...Object.keys(row.existed || {})])),
    encryptedKeys: envfile.encryptedSources(processedEnvs),
    validateEncryption,
    onKey
  })
  if (diagnostics.length === 0) return
  const error = new Errors({ message: diagnostics.map(diagnostic => diagnostic.message).join('; ') }).invalidEnv()
  error.diagnostics = diagnostics
  return error
}
