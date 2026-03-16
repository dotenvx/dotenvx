const fsx = require('./fsx')
const dotenvParse = require('./dotenvParse')

const guessPublicKeyName = require('./guessPublicKeyName')

// Strip surrounding quotes from a value (handles Windows env var edge case where quotes become part of value)
function stripSurroundingQuotes(value) {
  if (!value) return value
  return value.replace(/^(["'`])(.*)\1$/, '$2')
}

function searchProcessEnv(publicKeyName) {
  if (process.env[publicKeyName] && process.env[publicKeyName].length > 0) {
    return stripSurroundingQuotes(process.env[publicKeyName])
  }
}

function searchEnvFile(publicKeyName, envFilepath) {
  if (fsx.existsSync(envFilepath)) {
    const keysSrc = fsx.readFileX(envFilepath)
    const keysParsed = dotenvParse(keysSrc)

    if (keysParsed[publicKeyName] && keysParsed[publicKeyName].length > 0) {
      return keysParsed[publicKeyName]
    }
  }
}

function smartDotenvPublicKey(envFilepath) {
  let publicKey = null
  const publicKeyName = guessPublicKeyName(envFilepath) // DOTENV_PUBLIC_KEY_${ENVIRONMENT}

  // 1. attempt process.env first
  publicKey = searchProcessEnv(publicKeyName)
  if (publicKey) {
    return publicKey
  }

  // 2. attempt .env.keys second (path/to/.env.keys)
  publicKey = searchEnvFile(publicKeyName, envFilepath)
  if (publicKey) {
    return publicKey
  }

  return null
}

module.exports = smartDotenvPublicKey
