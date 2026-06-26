const path = require('path')
const { encrypted, encrypt, scan, upsert } = require('@dotenvx/primitives')

const Errors = require('../helpers/errors')
const decryptKeyValue = require('../helpers/cryptography/decryptKeyValue')

const TYPE_ENV_FILE = 'envFile'

function allValuesForKey (envSrc, key) {
  return scan(envSrc).parsed[key] || []
}

function finalValueForKey (envSrc, key) {
  const values = allValuesForKey(envSrc, key)
  return values.length > 0 ? values[values.length - 1] : null
}

function setTransform ({ envs = [], key = null, value = null, encrypt: shouldEncrypt = true } = {}) {
  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  for (const env of envs) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = {
      key: env.key || key,
      value: env.value === undefined ? value : env.value,
      type: TYPE_ENV_FILE,
      filepath,
      envFilepath,
      changed: false,
      envSrc: env.envSrc
    }

    if (env.envKeysFilepath) row.envKeysFilepath = env.envKeysFilepath
    if (env.localPrivateKeyAdded !== undefined) row.localPrivateKeyAdded = env.localPrivateKeyAdded
    if (env.remotePrivateKeyAdded !== undefined) row.remotePrivateKeyAdded = env.remotePrivateKeyAdded

    if (env.error) {
      row.error = env.error
      processedEnvs.push(row)
      continue
    }

    try {
      row.originalValue = finalValueForKey(row.envSrc, row.key)
      if (env.seededWithInitialKey) {
        row.originalValue = null
      }

      const wasPlainText = !encrypted(row.originalValue)

      if (shouldEncrypt) {
        if (env.privateKeyValue && row.originalValue) {
          row.originalValue = decryptKeyValue(row.key, row.originalValue, env.privateKeyName, env.privateKeyValue)
        }

        row.publicKey = env.publicKeyValue
        row.privateKey = env.privateKeyValue
        row.privateKeyName = env.privateKeyName

        try {
          row.encryptedValue = encrypt(row.publicKey, row.value)
        } catch {
          throw new Errors({ publicKeyName: env.publicKeyName, publicKey: row.publicKey }).invalidPublicKey()
        }
      }

      const goingFromPlainTextToEncrypted = wasPlainText && shouldEncrypt
      const valueChanged = row.value !== row.originalValue
      const duplicateKey = allValuesForKey(row.envSrc, row.key).length > 1
      const shouldPersistSeededPlainValue = env.seededWithInitialKey && !shouldEncrypt

      if (shouldPersistSeededPlainValue) {
        row.changed = true
        changedFilepaths.push(envFilepath)
      } else if (goingFromPlainTextToEncrypted || valueChanged || duplicateKey) {
        row.envSrc = upsert(row.envSrc, row.key, row.encryptedValue || row.value)
        row.changed = true
        changedFilepaths.push(envFilepath)
      } else {
        unchangedFilepaths.push(envFilepath)
      }
    } catch (error) {
      row.error = error
    }

    processedEnvs.push(row)
  }

  return {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

module.exports = setTransform
