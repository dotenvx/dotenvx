function redactedValues (processedEnvs, schema, processEnv = {}) {
  if (!schema?.exists) return []
  const result = new Set()

  const rows = [...(processedEnvs || [])]
  rows.push({ injected: Object.fromEntries([...schema.redactionRules.keys()].map(key => [key, processEnv[key]])) })
  for (const processedEnv of rows) {
    const values = {
      ...(processedEnv.injected || {}),
      ...(processedEnv.existed || {})
    }

    for (const [key, value] of Object.entries(values)) {
      const redacted = schema.redactionRules.get(key) ?? schema.redacted
      if (!redacted) continue
      if (value === undefined || value === null || value === '') continue

      result.add(`${value}`)
    }
  }

  return [...result]
}

module.exports = redactedValues
