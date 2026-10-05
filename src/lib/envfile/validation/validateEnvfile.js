const { check } = require('@dotenvx/primitives')
const Errors = require('../../helpers/errors')

module.exports = function validateEnvfile (policy, env) {
  if (!policy.exists) return { checked: {}, errors: [] }
  return check(policy, env)
}

module.exports.error = function validationError (diagnostics) {
  if (!diagnostics.length) return
  const error = new Errors({ message: diagnostics.map(item => item.message).join('; ') }).invalidEnv()
  error.diagnostics = diagnostics
  return error
}
