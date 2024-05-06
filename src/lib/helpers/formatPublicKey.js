function formatPublicKey(hex, filename) {
  return `dotenv://:${hex}@dotenvx.com/publicKey?env-file=${filename}`
}

module.exports = formatPublicKey
