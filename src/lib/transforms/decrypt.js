const fsx = require('./../helpers/fsx')
const path = require('path')
const { parse, upsert } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')
const providers = require('./../providers')

function parseError (error) {
  return new Errors({
    code: error.code,
    message: error.message,
    help: error.help
  }).custom()
}

async function decrypt (options = {}) {
  const envs = options.envs || []
  const ik = options.ik
  const ek = options.ek
  const fk = options.fk
  const provider = options.noArmor ? null : await providers(options)

  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { keys: [], type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
      const encoding = await detectEncoding(filepath)
      row.envSrc = await fsx.readFileX(filepath, { encoding })

      const { parsed, errors } = await parse(row.envSrc, { fk, ik, ek, array: true, provider })

      if (errors.length > 0) {
        row.error = parseError(errors[0])
      }

      for (const [key, values] of Object.entries(parsed)) {
        const before = row.envSrc
        const after = upsert(before, key, values)
        if (after !== before) {
          row.envSrc = after
          row.changed = true
          row.keys.push(key)
        }
      }

      if (row.changed) {
        changedFilepaths.push(envFilepath)
      } else {
        unchangedFilepaths.push(envFilepath)
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        row.error = new Errors({ envFilepath, filepath }).missingEnvFile()
      } else {
        row.error = error
      }
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
