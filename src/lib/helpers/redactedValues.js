const isPublicKey = require('./isPublicKey')

function redactedValues (processedEnvs) {
  const result = new Set()

  for (const processedEnv of processedEnvs || []) {
    const values = {
      ...(processedEnv.injected || {}),
      ...(processedEnv.existed || {})
    }

    for (const [key, value] of Object.entries(values)) {
      if (isPublicKey(key)) continue
      if (value === undefined || value === null || value === '') continue

      result.add(`${value}`)
    }
  }

  return [...result]
}

module.exports = redactedValues
