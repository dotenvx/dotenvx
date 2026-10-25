const Errors = require('./errors')

module.exports = function createValidationError (diagnostics) {
  if (!diagnostics.length) return
  const error = new Errors({ message: diagnostics.map(item => item.message).join('; ') }).invalidEnv()
  error.diagnostics = diagnostics
  return error
}
