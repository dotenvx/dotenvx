const isValidUrl = require('./isValidUrl')
const isValidEmail = require('./isValidEmail')
const { isIP } = require('node:net')

function validate (example = {}, env = {}, options = {}) {
  const errors = []
  const missingRequired = []

  for (const key of Object.keys(example)) {
    const value = env[key]
    const missing = !Object.prototype.hasOwnProperty.call(env, key) || value.trim() === ''
    if (missing) {
      missingRequired.push(key)
    }
  }

  if (missingRequired.length > 0) {
    errors.push({
      code: 'MISSING_REQUIRED',
      keys: missingRequired,
      message: missingRequired.map(key => `${key} is required`).join('; ')
    })
  }

  const invalidIntegers = []
  const invalidBooleans = []
  const invalidUrls = []
  const invalidEmails = []
  const invalidIps = []
  for (const [key, type] of options.types || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) continue
    const value = env[key].trim()
    if (value === '') continue // required checks handle blank values
    if (type === 'integer' && !/^[+-]?\d+$/.test(value)) invalidIntegers.push(key)
    if (type === 'boolean' && !['true', 'false', '1', '0'].includes(env[key])) invalidBooleans.push(key)
    if (type === 'url' && !isValidUrl(env[key])) invalidUrls.push(key)
    if (type === 'email' && !isValidEmail(env[key])) invalidEmails.push(key)
    if (type === 'ip' && isIP(env[key]) === 0) invalidIps.push(key)
  }
  if (invalidIntegers.length > 0) {
    errors.push({
      code: 'INVALID_INTEGER',
      keys: invalidIntegers,
      message: invalidIntegers.map(key => `${key} must be an integer`).join('; ')
    })
  }

  if (invalidBooleans.length > 0) {
    errors.push({
      code: 'INVALID_BOOLEAN',
      keys: invalidBooleans,
      message: invalidBooleans.map(key => `${key} must be true, false, 1, or 0`).join('; ')
    })
  }
  if (invalidUrls.length > 0) {
    errors.push({ code: 'INVALID_URL', keys: invalidUrls, message: invalidUrls.map(key => `${key} must be a valid URL`).join('; ') })
  }
  if (invalidEmails.length > 0) {
    errors.push({ code: 'INVALID_EMAIL', keys: invalidEmails, message: invalidEmails.map(key => `${key} must be a valid email address`).join('; ') })
  }
  if (invalidIps.length > 0) {
    errors.push({ code: 'INVALID_IP', keys: invalidIps, message: invalidIps.map(key => `${key} must be a valid IPv4 or IPv6 address`).join('; ') })
  }
  const invalidEnums = []
  for (const [key, choices] of options.enums || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key) || env[key].trim() === '') continue
    if (invalidIntegers.includes(key) || invalidBooleans.includes(key) || invalidUrls.includes(key) || invalidEmails.includes(key) || invalidIps.includes(key)) continue
    const value = env[key]
    const matches = options.types?.get(key) === 'integer'
      ? choices.some(choice => BigInt(choice.trim()) === BigInt(value.trim()))
      : choices.includes(value)
    if (!matches) invalidEnums.push(key)
  }
  if (invalidEnums.length > 0) {
    errors.push({
      code: 'INVALID_ENUM',
      keys: invalidEnums,
      message: invalidEnums.map(key => `${key} is not an allowed value`).join('; ')
    })
  }

  for (const [key, { min, max }] of options.ranges || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key) || env[key].trim() === '') continue
    if (invalidIntegers.includes(key)) continue
    const value = BigInt(env[key].trim())
    if (min !== undefined && value < BigInt(min)) {
      errors.push({ code: 'BELOW_MIN', keys: [key], message: `${key} must be at least ${min}` })
    }
    if (max !== undefined && value > BigInt(max)) {
      errors.push({ code: 'ABOVE_MAX', keys: [key], message: `${key} must be at most ${max}` })
    }
  }

  const unencrypted = []
  for (const key of options.encryptedKeys || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key) || env[key].trim() === '') continue
    if (!options.encryptedSources?.has(key)) unencrypted.push(key)
  }
  if (unencrypted.length > 0) {
    errors.push({ code: 'EXPECTED_ENCRYPTED', keys: unencrypted, message: unencrypted.map(key => `${key} is not encrypted`).join('; ') })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

module.exports = validate
