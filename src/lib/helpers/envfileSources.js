const { scan, remove } = require('@dotenvx/primitives')
const readEnvfile = require('../envfile/parsing/readEnvfile')

// Capture ambient values once: file layers must never become env overrides.
module.exports = function envfileSources (options, processEnv) {
  const policy = readEnvfile(undefined, (options.envs || []).filter(env => env.type === 'envFile').map(env => env.value))
  const ambient = { ...processEnv }
  const sourceFor = key => policy.keys[key]?.env.source ?? policy.source
  const initialKeys = new Set(Object.keys(policy.keys))
  for (const key of initialKeys) {
    if (/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)) continue
    if (sourceFor(key) === 'file') delete processEnv[key]
  }
  const seen = new Set()
  return (src, type) => {
    let filtered = src
    for (const key of Object.keys(scan(src).parsed)) {
      if (/^DOTENV_(?:PUBLIC|PRIVATE)_KEY(?:_|$)/.test(key)) continue
      const source = sourceFor(key)
      if (source === 'file' && !seen.has(key)) delete processEnv[key]
      seen.add(key)
      if (source === undefined) continue
      // Inline inputs are not an inherited environment or a selected file.
      const excluded = type !== 'envFile' || source === 'env' ||
        (Array.isArray(source) && Object.hasOwn(ambient, key))
      if (excluded) filtered = remove(filtered, key)
    }
    return filtered
  }
}
