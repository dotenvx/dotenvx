function optionalKeys (comments) {
  const keys = new Set()

  for (const [key, values] of Object.entries(comments)) {
    if (values.some(comment => comment && /\boptional\b/i.test(comment))) {
      keys.add(key)
    }
  }

  return keys
}

function validate (example = {}, env = {}, options = {}) {
  const errors = []
  const missingRequired = []
  const optional = optionalKeys(options.comments || {})

  for (const key of Object.keys(example)) {
    const value = env[key]
    const missing = !Object.prototype.hasOwnProperty.call(env, key) || value.trim() === ''
    if (!optional.has(key) && missing) {
      missingRequired.push(key)
    }
  }

  if (missingRequired.length > 0) {
    errors.push({
      code: 'MISSING_REQUIRED',
      keys: missingRequired,
      message: `missing required (${missingRequired.join(', ')})`
    })
  }

  const invalidIntegers = []
  const invalidBooleans = []
  for (const [key, type] of options.types || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key)) continue
    const value = env[key].trim()
    if (value === '') continue // required checks handle blank values
    if (type === 'integer' && !/^[+-]?\d+$/.test(value)) invalidIntegers.push(key)
    if (type === 'boolean' && !['true', 'false', '1', '0'].includes(env[key])) invalidBooleans.push(key)
  }
  if (invalidIntegers.length > 0) {
    errors.push({
      code: 'INVALID_INTEGER',
      keys: invalidIntegers,
      message: `expected integer (${invalidIntegers.join(', ')})`
    })
  }

  if (invalidBooleans.length > 0) {
    errors.push({
      code: 'INVALID_BOOLEAN',
      keys: invalidBooleans,
      message: `expected boolean (true, false, 1, or 0) (${invalidBooleans.join(', ')})`
    })
  }
  const invalidEnums = []
  for (const [key, choices] of options.enums || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key) || env[key].trim() === '') continue
    if (invalidIntegers.includes(key) || invalidBooleans.includes(key)) continue
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
      message: `not in enum (${invalidEnums.join(', ')})`
    })
  }

  for (const [key, { min, max }] of options.ranges || []) {
    if (!Object.prototype.hasOwnProperty.call(env, key) || env[key].trim() === '') continue
    if (invalidIntegers.includes(key)) continue
    const value = BigInt(env[key].trim())
    if (min !== undefined && value < BigInt(min)) {
      errors.push({ code: 'BELOW_MIN', keys: [key], message: `below min ${min} (${key})` })
    }
    if (max !== undefined && value > BigInt(max)) {
      errors.push({ code: 'ABOVE_MAX', keys: [key], message: `above max ${max} (${key})` })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

module.exports = validate
