const { encrypted } = require('@dotenvx/primitives')

module.exports = function checkEncryption (policy, sources) {
  const diagnostics = []
  for (const source of sources) {
    if (source.type !== 'file' && source.type !== 'env') throw new TypeError('source.type must be file or env')
    const sourcePolicy = source.policy || policy
    for (const [key, arrivals] of Object.entries(source.values)) {
      if (!Object.hasOwn(sourcePolicy.keys, key)) continue
      const entry = sourcePolicy.keys[key]
      const requirement = entry?.fs.encrypted ?? false
      const required = source.type === 'env' ? requirement === 'always' : requirement !== false
      if (!required) continue
      const plaintext = source.type === 'env'
        ? arrivals.some(value => !encrypted(value))
        : !key.startsWith('DOTENV_PUBLIC_KEY') && arrivals.some(value =>
            value.trim() !== '' && !encrypted(value) && !value.startsWith('op://') && !value.startsWith('bw://'))
      if (!plaintext) continue
      diagnostics.push({
        key,
        code: 'NOT_ENCRYPTED',
        rule: 'encrypted',
        message: `${key} must be encrypted in ${source.name || source.type}`,
        strict: entry?.env.strict ?? false
      })
    }
  }
  return diagnostics
}
