const { scan, encrypted } = require('@dotenvx/primitives')

module.exports = function plaintextKeys (content) {
  return Object.entries(scan(content).parsed)
    .filter(([key, values]) => !key.startsWith('DOTENV_PUBLIC_KEY') && values.some(value =>
      value.trim() !== '' && !encrypted(value) && !value.startsWith('op://') && !value.startsWith('bw://')
    ))
    .map(([key]) => key)
}
