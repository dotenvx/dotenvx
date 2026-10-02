const { encrypted } = require('@dotenvx/primitives')
const diagnosticLocations = require('../validation/diagnosticLocation')
const { getColor } = require('../../../shared/colors')

function displayValue (value) {
  const hasControl = Array.from(value).some(char => char.charCodeAt(0) < 32)
  if (value && !hasControl && !/[\s#"'`\\\x7f-\x9f]/.test(value)) return value
  return JSON.stringify(value).replace(/[\x7f-\x9f\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

// Show final resolved values once, not source contents or unrelated shell variables.
module.exports = function previewEnvspec (processedEnvs, schema, processEnv, diagnostics = []) {
  const keys = new Set((processedEnvs || []).flatMap(row => [...Object.keys(row.parsed || {}), ...Object.keys(row.injected || {}), ...Object.keys(row.existed || {})]))
  for (const key of schema.redactionRules.keys()) keys.add(key)
  const location = diagnosticLocations(processedEnvs || [], 'process.env', { environmentLabel: 'process.env' })
  const rows = []
  const errors = new Map()
  for (const diagnostic of diagnostics) {
    keys.add(diagnostic.key)
    const message = diagnostic.rule
      ? `!${diagnostic.rule}`
      : diagnostic.code === 'EXPECTED_ENCRYPTED'
        ? '!encrypted'
        : diagnostic.code === 'MISSING_REQUIRED'
          ? '!required'
          : `! ${diagnostic.message.slice(diagnostic.key.length + 1).replace(/^is /, '')}`
    errors.set(diagnostic.key, [...new Set([...(errors.get(diagnostic.key) || []), message])])
  }
  for (const key of keys) {
    const missing = processEnv[key] === undefined
    if (/^DOTENV_(?:PUBLIC|PRIVATE)_KEY/.test(key) || (missing && !errors.has(key))) continue
    const value = String(processEnv[key])
    const redacted = schema.redactionRules.get(key) ?? true
    const display = missing ? '[MISSING]' : redacted || encrypted(value) ? '[REDACTED]' : displayValue(value)
    const source = missing ? '' : displayValue(location(key))
    const error = errors.has(key) ? errors.get(key).join(', ') : ''
    const unspecced = !schema.redactionRules.has(key)
    const status = [unspecced ? '!declared' : '', error].filter(Boolean).join(', ')
    rows.push({ assignment: `${key}=${display}`, comment: [source, status].filter(Boolean).join(' '), error, unspecced })
  }
  const width = Math.max(0, ...rows.map(row => row.assignment.length))
  return rows.map(({ assignment, comment, error, unspecced }) => {
    const line = `${assignment.padEnd(width)} # ${comment}`
    return error
      ? getColor('red', process.stdout)(`☠ ${line}`)
      : unspecced
        ? getColor('orangered', process.stdout)(`⚠ ${line}`)
        : `${getColor('green', process.stdout)('✔')} ${getColor('gray', process.stdout)(line)}`
  }).join('\n')
}
