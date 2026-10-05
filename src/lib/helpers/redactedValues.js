const isPublicKey = require('./isPublicKey')

function redactedValues (processedEnvs, schema, processEnv = {}, legacyRedact = false) {
  if (!schema?.exists && !legacyRedact) return []
  const result = new Set()

  const rows = [...(processedEnvs || [])]
  if (schema?.exists) {
    rows.push({ injected: Object.fromEntries(Object.keys(schema.keys).map(key => [key, processEnv[key]])) })
  }
  for (const processedEnv of rows) {
    const values = {
      ...(processedEnv.injected || {}),
      ...(processedEnv.existed || {})
    }

    for (const [key, value] of Object.entries(values)) {
      const redacted = schema?.exists ? (schema.keys[key]?.stdio.redacted ?? true) : !isPublicKey(key)
      if (!redacted) continue
      if (value === undefined || value === null || value === '') continue

      result.add(`${value}`)
    }
  }

  return [...result]
}

module.exports = redactedValues
