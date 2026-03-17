const path = require('path')

const fsx = require('./../fsx')
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

function smartKeyValues (filepath, keysFilepath = null) {
  const names = guessKeyNames(filepath)
  const publicKeyName = names.publicKeyName // DOTENV_PUBLIC_KEY_${ENVIRONMENT}
  let privateKeyName = names.privateKeyName // DOTENV_PRIVATE_KEY_${ENVIRONMENT}

  let publicKey = null
  let privateKey = null

  // public key: process.env first, then .env*
  publicKey = readProcessEnvKey(publicKeyName)
  if (!publicKey) {
    publicKey = readEnvFileKey(publicKeyName, filepath) || null
  }
  // TODO: read from Ops

  // private key: process.env first, then .env.keys
  privateKey = readProcessEnvKey(privateKeyName)
  if (!privateKey) {
    if (keysFilepath) { // user specified -fk flag
      keysFilepath = path.resolve(keysFilepath)
    } else {
      keysFilepath = path.resolve(path.dirname(filepath), '.env.keys') // typical scenario
    }

    privateKey = readEnvFileKey(privateKeyName, keysFilepath)

    // attempt inverting DOTENV_PUBLIC_KEY* name for custom filenames
    if (!privateKey) {
      privateKeyName = invertForPrivateKeyName(filepath)
      if (privateKeyName) {
        privateKey = readProcessEnvKey(privateKeyName)
        if (!privateKey) {
          privateKey = readEnvFileKey(privateKeyName, keysFilepath)
        }
      }
    }
  }
  // TODO: read from Ops

  return {
    publicKeyValue: publicKey || null, // important to make sure name is rendered
    privateKeyValue: privateKey || null // importan to make sure name is rendered
  }
}

module.exports = smartKeyValues
