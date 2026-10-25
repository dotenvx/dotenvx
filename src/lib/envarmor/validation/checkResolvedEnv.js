const { check, scan } = require('@dotenvx/primitives')
const readEnvarmor = require('../parsing/readEnvarmor')

module.exports = function checkResolvedEnv (policy, env, processedEnvs = [], { policyForFile = filepath => readEnvarmor(undefined, [filepath]) } = {}) {
  if (!policy.exists) return { checked: {}, errors: [] }
  const sources = new Map()
  for (const row of processedEnvs) {
    for (const key of Object.keys(row.injected || {})) sources.set(key, row.inherited ? 'env' : row.type)
    for (const key of Object.keys(row.existed || {})) {
      if (!sources.has(key)) sources.set(key, 'env')
    }
  }
  const arrivals = []
  // Preserve diagnostic order: inherited values, then file values.
  const originalSources = [...processedEnvs.filter(row => row.type === 'env'), ...processedEnvs.filter(row => row.type === 'envFile')]
  for (const row of originalSources) {
    const inherited = row.type === 'env'
    if (!inherited && row.src === undefined) continue
    const values = Object.fromEntries(Object.entries(row.originalValues || scan(inherited ? row.string : row.src).parsed)
      .filter(([key]) => sources.get(key) === (inherited ? 'env' : 'envFile')))
    arrivals.push({
      type: inherited ? 'env' : 'file',
      name: inherited ? 'env' : row.filepath,
      policy: inherited ? policy : policyForFile(row.filepath),
      values
    })
  }
  return check(policy, env, { sources: arrivals })
}
