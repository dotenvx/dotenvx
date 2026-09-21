const { scan, encrypted } = require('@dotenvx/primitives')

function hasPlaintextSecrets (src) {
  const { parsed } = scan(src)
  return Object.entries(parsed).some(([key, values]) => {
    if (key.startsWith('DOTENV_PUBLIC_KEY') || key.endsWith('_PLAIN')) return false
    return values.some(value => value.trim() !== '' && !encrypted(value))
  })
}

module.exports = hasPlaintextSecrets
