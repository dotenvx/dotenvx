function formatPrivateKey(hex, filename) {
  return `dotenv://:${hex}@dotenvx.com/privateKey?env-file=${filename}`
}

module.exports = formatPrivateKey
