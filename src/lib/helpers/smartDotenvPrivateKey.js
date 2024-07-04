const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const PUBLIC_KEY_SCHEMA = 'DOTENV_PUBLIC_KEY'
const PRIVATE_KEY_SCHEMA = 'DOTENV_PRIVATE_KEY'

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

  // fallback to checking for presence of DOTENV_PUBLIC_KEY* in file and invert it
  if (fs.existsSync(envFilepath)) {
    const envSrc = fs.readFileSync(envFilepath)
    const envParsed = dotenv.parse(envSrc)

    let publicKeyName
    for (const keyName of Object.keys(envParsed)) {
      if (keyName === PUBLIC_KEY_SCHEMA || keyName.startsWith(PUBLIC_KEY_SCHEMA)) {
        publicKeyName = keyName
      }
    }

    if (publicKeyName) {
      const privateKeyNameCalculated = publicKeyName.replace(PUBLIC_KEY_SCHEMA, PRIVATE_KEY_SCHEMA)

      // process.env wins
      if (process.env[privateKeyNameCalculated] && process.env[privateKeyNameCalculated].length > 0) {
        return process.env[privateKeyNameCalculated]
      }

      // fallback to presence of .env.keys - path/to/.env.keys
      const directory = path.dirname(envFilepath)
      const envKeysFilepath = path.resolve(directory, '.env.keys')
      if (fs.existsSync(envKeysFilepath)) {
        const keysSrc = fs.readFileSync(envKeysFilepath)
        const keysParsed = dotenv.parse(keysSrc)

        if (keysParsed[privateKeyNameCalculated] && keysParsed[privateKeyNameCalculated].length > 0) {
          return keysParsed[privateKeyNameCalculated]
        }
      }
    }
  }

  return null
}

module.exports = smartDotenvPrivateKey
