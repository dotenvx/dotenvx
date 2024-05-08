const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const guessPrivateKeyName = require('./guessPrivateKeyName')

function smartDotenvPrivateKey (envFilepath) {
  const privateKeyName = guessPrivateKeyName(envFilepath) // DOTENV_PRIVATE_KEY_${ENVIRONMENT}

  // process.env wins
  if (process.env[privateKeyName] && process.env[privateKeyName].length > 0) {
    return process.env[privateKeyName]
  }

  // fallback to presence of .env.keys - path/to/.env.keys
  const directory = path.dirname(envFilepath)
  const envKeysFilepath = path.resolve(directory, '.env.keys')
  if (fs.existsSync(envKeysFilepath)) {
    const keysSrc = fs.readFileSync(envKeysFilepath)
    const keysParsed = dotenv.parse(keysSrc)

    if (keysParsed[privateKeyName] && keysParsed[privateKeyName].length > 0) {
      return keysParsed[privateKeyName]
    }
  }

  return null
}

module.exports = smartDotenvPrivateKey
