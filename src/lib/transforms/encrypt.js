const path = require('path')
const picomatch = require('picomatch')
const { encrypted, encrypt, scan, upsert } = require('@dotenvx/primitives')

const Errors = require('../helpers/errors')
const isPublicKey = require('../helpers/cryptography/isPublicKey')

const TYPE_ENV_FILE = 'envFile'

function list (value) {
  if (!Array.isArray(value)) {
    return [value]
  }

  return value
}

async function encryptTransform ({ envs = [], key = [], excludeKey = [] } = {}) {
  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []
  const keys = list(key)
  const excludeKeys = list(excludeKey)
  const exclude = picomatch(excludeKeys)
  const include = picomatch(keys, { ignore: excludeKeys })

  for (const env of envs) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = {
      keys: [],
      type: TYPE_ENV_FILE,
      filepath,
      envFilepath,
      publicKey: env.publicKeyValue,
      privateKey: env.privateKeyValue,
      privateKeyName: env.privateKeyName,
      changed: env.changed || false,
      envSrc: env.envSrc
    }

    if (env.kitCreated) row.kitCreated = env.kitCreated
    if (env.localPrivateKeyAdded !== undefined) row.localPrivateKeyAdded = env.localPrivateKeyAdded
    if (env.remotePrivateKeyAdded !== undefined) row.remotePrivateKeyAdded = env.remotePrivateKeyAdded
    if (env.envKeysFilepath) row.envKeysFilepath = env.envKeysFilepath

    try {
      const envParsed = scan(row.envSrc).parsed

      for (const [key, values] of Object.entries(envParsed)) {
        if (exclude(key)) {
          continue
        }

        if (keys.length > 0 && !include(key)) {
          continue
        }

        const fullyEncrypted = values.every(value => encrypted(value) || isPublicKey(key))
        if (fullyEncrypted) {
          continue
        }

        row.keys.push(key)

        const encryptedValues = values.map(value => {
          if (encrypted(value) || isPublicKey(key)) {
            return value
          }

          try {
            return encrypt(row.publicKey, value)
          } catch {
            throw new Errors({ publicKeyName: env.publicKeyName, publicKey: row.publicKey }).invalidPublicKey()
          }
        })

        row.envSrc = upsert(row.envSrc, key, encryptedValues)
        row.changed = true
      }

      if (row.changed) {
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

module.exports = encryptTransform
