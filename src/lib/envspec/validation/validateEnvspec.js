const validate = require('./validate')
const encryptedSources = require('./encryptedSources')
const Errors = require('../../helpers/errors')

module.exports = function validateEnvspec (schema, env, processedEnvs, onKey, { validateEncryption = true } = {}) {
  if (!schema.exists) return
  const diagnostics = new Map()
  const schemas = schema.schemas || [schema]
  const sources = validateEncryption ? encryptedSources(processedEnvs) : undefined
  // Include loaded keys and their shell overrides, not unrelated host variables.
  const loadedKeys = new Set((processedEnvs || []).flatMap(row => [...Object.keys(row.injected || {}), ...Object.keys(row.existed || {})]))
  const declaredKeys = new Set(schemas.flatMap(rules => [...rules.encryptionRules.keys()]))
  // Defaults apply only to keys absent from every active policy. An unrelated
  // file block must not undo another block's explicit plaintext exception.
  const undeclaredKeys = [...loadedKeys].filter(key => !declaredKeys.has(key))
  for (const rules of schemas) {
    const { requiredKeys, types, enums, ranges } = rules
    const encryptedKeys = new Set(validateEncryption
      ? [...rules.encryptedKeys, ...undeclaredKeys].filter(key =>
          !key.startsWith('DOTENV_PUBLIC_KEY') && (rules.encryptionRules.get(key) ?? true)
        )
      : [])
    const keys = new Set([...requiredKeys, ...types.keys(), ...enums.keys(), ...ranges.keys(), ...encryptedKeys, ...(rules.redactionRules?.keys() || [])])
    for (const key of keys) {
      if (onKey) onKey(key)
      const validation = validate(requiredKeys.includes(key) ? { [key]: '' } : {}, env, {
        types: types.has(key) ? new Map([[key, types.get(key)]]) : undefined,
        enums: enums.has(key) ? new Map([[key, enums.get(key)]]) : undefined,
        ranges: ranges.has(key) ? new Map([[key, ranges.get(key)]]) : undefined,
        encryptedKeys: encryptedKeys.has(key) ? [key] : [],
        encryptedSources: sources
      })
      for (const error of validation.errors) {
        const strict = rules.strict === true || diagnostics.get(error.message)?.strict === true
        const type = rules.declaredTypes?.get(key) || types.get(key)
        const rule = {
          MISSING_REQUIRED: 'required',
          EXPECTED_ENCRYPTED: 'encrypted',
          INVALID_INTEGER: type,
          INVALID_BOOLEAN: 'boolean',
          INVALID_URL: 'url',
          INVALID_EMAIL: 'email',
          INVALID_IP: 'ip',
          INVALID_ENUM: 'enum',
          BELOW_MIN: type === 'port' ? 'port' : 'min',
          ABOVE_MAX: type === 'port' ? 'port' : 'max'
        }[error.code]
        diagnostics.set(error.message, { key, code: error.code, message: error.message, strict, rule })
      }
    }
  }
  if (diagnostics.size > 0) {
    const error = new Errors({ message: [...diagnostics.keys()].join('; ') }).invalidEnv()
    error.diagnostics = [...diagnostics.values()]
    return error
  }
}
