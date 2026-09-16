const validate = require('./validate')
const encryptedSources = require('./encryptedSources')
const Errors = require('./errors')

module.exports = function validateEnvfile (schema, env, processedEnvs) {
  const { requiredKeys, types, enums, ranges, encryptedKeys } = schema
  const required = Object.fromEntries(requiredKeys.map(key => [key, '']))
  const validation = validate(required, env, {
    types,
    enums,
    ranges,
    encryptedKeys,
    encryptedSources: encryptedKeys.length > 0 ? encryptedSources(processedEnvs) : undefined
  })
  if (!validation.valid) {
    return new Errors({ message: validation.errors.map(error => error.message).join('; ') }).invalidEnv()
  }
}
