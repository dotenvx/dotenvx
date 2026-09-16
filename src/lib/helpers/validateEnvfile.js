const validate = require('./validate')
const encryptedSources = require('./encryptedSources')
const Errors = require('./errors')

module.exports = function validateEnvfile (schema, env, processedEnvs) {
  const messages = new Set()
  const schemas = schema.schemas || [schema]
  const sources = schemas.some(rules => rules.encryptedKeys.length > 0) ? encryptedSources(processedEnvs) : undefined
  for (const rules of schemas) {
    const { requiredKeys, types, enums, ranges, encryptedKeys } = rules
    const required = Object.fromEntries(requiredKeys.map(key => [key, '']))
    const validation = validate(required, env, {
      types,
      enums,
      ranges,
      encryptedKeys,
      encryptedSources: sources
    })
    for (const error of validation.errors) messages.add(error.message)
  }
  if (messages.size > 0) {
    return new Errors({ message: [...messages].join('; ') }).invalidEnv()
  }
}
