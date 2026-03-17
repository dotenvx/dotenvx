const fsx = require('./../fsx')
const path = require('path')

const dotenvParse = require('./../dotenvParse')
const guessKeyNames = require('./guessKeyNames')
const readProcessEnvKey = require('./readProcessEnvKey')
const readEnvFileKey = require('./readEnvFileKey')

function invertForPrivateKeyName (filepath) {
  const PUBLIC_KEY_SCHEMA = 'DOTENV_PUBLIC_KEY'
  const PRIVATE_KEY_SCHEMA = 'DOTENV_PRIVATE_KEY'

  if (!fsx.existsSync(filepath)) {
    return null
  }

  const envSrc = fsx.readFileX(filepath)
  const envParsed = dotenvParse(envSrc)

  let publicKeyName
  for (const keyName of Object.keys(envParsed)) {
    if (keyName === PUBLIC_KEY_SCHEMA || keyName.startsWith(PUBLIC_KEY_SCHEMA)) {
      publicKeyName = keyName // find DOTENV_PUBLIC_KEY* in filename
    }
  }

  if (publicKeyName) {
    return publicKeyName.replace(PUBLIC_KEY_SCHEMA, PRIVATE_KEY_SCHEMA) // return inverted (DOTENV_PUBLIC_KEY* -> DOTENV_PRIVATE_KEY*) if found
  }

  return null
}

function smartPrivateKey (filepath, keysFilepath = null) {
  let { privateKeyName } = guessKeyNames(filepath) // DOTENV_PRIVATE_KEY_${ENVIRONMENT}

  let privateKey = null

  // 1. attempt process.env first
  privateKey = readProcessEnvKey(privateKeyName)
  if (privateKey) {
    return privateKey
  }

  if (keysFilepath) { // user specified -fk flag
    keysFilepath = path.resolve(keysFilepath)
  } else {
    keysFilepath = path.resolve(path.dirname(filepath), '.env.keys') // typical scenario
  }

  // 2. attempt .env.keys second (path/to/.env.keys)
  privateKey = readEnvFileKey(privateKeyName, keysFilepath)
  if (privateKey) {
    return privateKey
  }

  // 3. attempt inverting `DOTENV_PUBLIC_KEY*` name inside file (unlocks custom filenames not matching .env.${ENVIRONMENT} pattern)
  privateKeyName = invertForPrivateKeyName(filepath)
  if (privateKeyName) {
    // 3.1 attempt process.env first
    privateKey = readProcessEnvKey(privateKeyName)
    if (privateKey) {
      return privateKey
    }

    // 3.2. attempt .env.keys second (path/to/.env.keys)
    privateKey = readEnvFileKey(privateKeyName, keysFilepath)
    if (privateKey) {
      return privateKey
    }
  }

  return null
}

module.exports = smartPrivateKey
