const path = require('path')

const dotenvParse = require('./../dotenvParse')
const readFileKeySync = require('./readFileKeySync')
const opsKeypairSync = require('../cryptography/opsKeypairSync')

const PUBLIC_KEY_SCHEMA = 'DOTENV_PUBLIC_KEY'
const PRIVATE_KEY_SCHEMA = 'DOTENV_PRIVATE_KEY'

function readProcessKey (processEnv, keyName) {
  if (processEnv[keyName] && processEnv[keyName].length > 0) {
    return processEnv[keyName]
  }
}

function publicKeyNameFromEnvSrc (envParsed) {
  for (const keyName of Object.keys(envParsed)) {
    if (keyName === PUBLIC_KEY_SCHEMA || keyName.startsWith(PUBLIC_KEY_SCHEMA)) {
      return keyName
    }
  }

  return null
}

function keyValuesFromEnvSrc (src, privateKeyName = null, opts = {}) {
  let keysFilepath = opts.keysFilepath || null
  const noOps = opts.noOps === true
  const processEnv = opts.processEnv || process.env
  const envParsed = dotenvParse(src)

  const publicKeyName = publicKeyNameFromEnvSrc(envParsed)
  const publicKeyValue = publicKeyName ? readProcessKey(processEnv, publicKeyName) || envParsed[publicKeyName] || null : null

  if (!privateKeyName && publicKeyName) {
    privateKeyName = publicKeyName.replace(PUBLIC_KEY_SCHEMA, PRIVATE_KEY_SCHEMA)
  }

  let privateKeyValue = null
  if (privateKeyName) {
    privateKeyValue = readProcessKey(processEnv, privateKeyName)

    if (!privateKeyValue) {
      if (keysFilepath) {
        keysFilepath = path.resolve(keysFilepath)
      } else {
        keysFilepath = path.resolve('.env.keys')
      }

      privateKeyValue = readFileKeySync(privateKeyName, keysFilepath)
    }
  }

  if (!noOps && !privateKeyValue && publicKeyValue && publicKeyValue.length > 0) {
    const kp = opsKeypairSync(publicKeyValue)
    privateKeyValue = kp.privateKey
  }

  return {
    publicKeyValue: publicKeyValue || null,
    privateKeyValue: privateKeyValue || null,
    privateKeyName: privateKeyName || null
  }
}

module.exports = keyValuesFromEnvSrc
