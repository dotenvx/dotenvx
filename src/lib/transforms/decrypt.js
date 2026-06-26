const path = require('path')
const picomatch = require('picomatch')
const { encrypted, scan, upsert } = require('@dotenvx/primitives')

const decryptKeyValue = require('../helpers/cryptography/decryptKeyValue')

const TYPE_ENV_FILE = 'envFile'

function list (value) {
  if (!Array.isArray(value)) {
    return [value]
  }

  return value
}

async function decrypt ({ envs = [], key = [], excludeKey = [] } = {}) {
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
      privateKey: env.privateKeyValue,
      privateKeyName: env.privateKeyName,
      changed: false,
      envSrc: env.envSrc
    }

    try {
      const envParsed = scan(row.envSrc).parsed

      for (const [key, values] of Object.entries(envParsed)) {
        if (exclude(key)) {
          continue
        }

        if (keys.length > 0 && !include(key)) {
          continue
        }

        const hasEncrypted = values.some(value => encrypted(value))
        if (!hasEncrypted) {
          continue
        }

        row.keys.push(key)

        const decryptedValues = values.map(value => {
          if (!encrypted(value)) {
            return value
          }

          return decryptKeyValue(key, value, row.privateKeyName, row.privateKey)
        })

        row.envSrc = upsert(row.envSrc, key, decryptedValues)
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

module.exports = decrypt
