const { check } = require('@dotenvx/primitives')
const Errors = require('../../helpers/errors')
const plaintextKeys = require('../../helpers/plaintextKeys')
const readEnvfile = require('../parsing/readEnvfile')

module.exports = function validateEnvfile (policy, env, processedEnvs = []) {
  if (!policy.exists) return { checked: {}, errors: [] }
  const result = check(policy, env)
  const sources = new Map()
  for (const row of processedEnvs) {
    for (const key of Object.keys(row.injected || {})) sources.set(key, row.type)
    for (const key of Object.keys(row.existed || {})) {
      if (!sources.has(key)) sources.set(key, 'env')
    }
  }
  for (const row of processedEnvs) {
    if (row.type !== 'envFile' || row.src === undefined) continue
    const filePolicy = readEnvfile(undefined, [row.filepath])
    for (const key of plaintextKeys(row.src)) {
      if (sources.get(key) !== 'envFile') continue
      const rules = filePolicy.keys[key]
      if (!(rules?.fs.encrypted ?? filePolicy.encrypted ?? true)) continue
      result.errors.push({
        key,
        code: 'NOT_ENCRYPTED',
        rule: 'encrypted',
        message: `${key} must be encrypted in ${row.filepath}`,
        strict: rules?.env.strict ?? filePolicy.strict ?? false
      })
    }
  }
  return result
}

module.exports.error = function validationError (diagnostics) {
  if (!diagnostics.length) return
  const error = new Errors({ message: diagnostics.map(item => item.message).join('; ') }).invalidEnv()
  error.diagnostics = diagnostics
  return error
}
