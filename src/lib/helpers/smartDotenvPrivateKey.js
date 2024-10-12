const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const ENCODING = 'utf8'
const PUBLIC_KEY_SCHEMA = 'DOTENV_PUBLIC_KEY'
const PRIVATE_KEY_SCHEMA = 'DOTENV_PRIVATE_KEY'

const guessPrivateKeyName = require('./guessPrivateKeyName')

function searchProcessEnv (privateKeyName) {
  if (process.env[privateKeyName] && process.env[privateKeyName].length > 0) {
    return process.env[privateKeyName]
  }
}

function searchKeysFile (privateKeyName, envFilepath) {
  const directory = path.dirname(envFilepath)
  const envKeysFilepath = path.resolve(directory, '.env.keys')

  if (fs.existsSync(envKeysFilepath)) {
    const keysSrc = fs.readFileSync(envKeysFilepath, { encoding: ENCODING })
    const keysParsed = dotenv.parse(keysSrc)

    if (keysParsed[privateKeyName] && keysParsed[privateKeyName].length > 0) {
      return keysParsed[privateKeyName]
    }
  }
}

function invertForPrivateKeyName (envFilepath) {
  if (!fs.existsSync(envFilepath)) {
    return null
  }

  const envSrc = fs.readFileSync(envFilepath, { encoding: ENCODING })
  const envParsed = dotenv.parse(envSrc)

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

function smartDotenvPrivateKey (envFilepath) {
  let privateKey = null
  let privateKeyName = guessPrivateKeyName(envFilepath) // DOTENV_PRIVATE_KEY_${ENVIRONMENT}

  // 1. attempt process.env first
  privateKey = searchProcessEnv(privateKeyName)
  if (privateKey) {
    return privateKey
  }

  // 2. attempt .env.keys second (path/to/.env.keys)
  privateKey = searchKeysFile(privateKeyName, envFilepath)
  if (privateKey) {
    return privateKey
  }

  // 3. attempt inverting `DOTENV_PUBLIC_KEY*` name inside file (unlocks custom filenames not matching .env.${ENVIRONMENT} pattern)
  privateKeyName = invertForPrivateKeyName(envFilepath)
  if (privateKeyName) {
    // 3.1 attempt process.env first
    privateKey = searchProcessEnv(privateKeyName)
    if (privateKey) {
      return privateKey
    }

    // 3.2. attempt .env.keys second (path/to/.env.keys)
    privateKey = searchKeysFile(privateKeyName, envFilepath)
    if (privateKey) {
      return privateKey
    }
  }

  return null
}

module.exports = smartDotenvPrivateKey
