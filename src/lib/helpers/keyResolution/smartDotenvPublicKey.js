const guessKeyNames = require('./guessKeyNames')
const readProcessEnvKey = require('./readProcessEnvKey')
const readEnvFileKey = require('./readEnvFileKey')

function smartDotenvPublicKey (filepath) {
  const { publicKeyName } = guessKeyNames(filepath) // DOTENV_PUBLIC_KEY_${ENVIRONMENT}

  let publicKey = null

  // 1. attempt process.env first
  publicKey = readProcessEnvKey(publicKeyName)
  if (publicKey) {
    return publicKey
  }

  // 2. attempt .env* second
  publicKey = readEnvFileKey(publicKeyName, filepath)
  if (publicKey) {
    return publicKey
  }

  return null
}

module.exports = smartDotenvPublicKey
