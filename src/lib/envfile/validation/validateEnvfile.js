const validate = require('./validate')
const encryptedSources = require('./encryptedSources')
const Errors = require('../../helpers/errors')

module.exports = function validateEnvfile (schema, env, processedEnvs, onKey) {
  const diagnostics = new Map()
  const schemas = schema.schemas || [schema]
  const sources = schemas.some(rules => rules.encryptedKeys.length > 0) ? encryptedSources(processedEnvs) : undefined
  for (const rules of schemas) {
    const { requiredKeys, types, enums, ranges, encryptedKeys } = rules
    const keys = new Set([...requiredKeys, ...types.keys(), ...enums.keys(), ...ranges.keys(), ...encryptedKeys, ...(rules.redactionRules?.keys() || [])])
    for (const key of keys) {
      if (onKey) onKey(key)
      const validation = validate(requiredKeys.includes(key) ? { [key]: '' } : {}, env, {
        types: types.has(key) ? new Map([[key, types.get(key)]]) : undefined,
        enums: enums.has(key) ? new Map([[key, enums.get(key)]]) : undefined,
        ranges: ranges.has(key) ? new Map([[key, ranges.get(key)]]) : undefined,
        encryptedKeys: encryptedKeys.includes(key) ? [key] : [],
        encryptedSources: sources
      })
      for (const error of validation.errors) {
        diagnostics.set(error.message, { key, code: error.code, message: error.message })
      }
    }
  }
  if (diagnostics.size > 0) {
    const error = new Errors({ message: [...diagnostics.keys()].join('; ') }).invalidEnv()
    error.diagnostics = [...diagnostics.values()]
    return error
  }
}
