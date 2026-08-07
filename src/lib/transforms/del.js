const fsx = require('./../helpers/fsx')
const path = require('path')
const { remove } = require('@dotenvx/primitives')

const TYPE_ENV_FILE = 'envFile'

const Errors = require('./../helpers/errors')
const { determine } = require('./../helpers/envResolution')
const detectEncoding = require('./../helpers/detectEncoding')

async function delTransform (options = {}) {
  const envs = options.envs || []
  const key = options.key

  const processedEnvs = []
  const changedFilepaths = []
  const unchangedFilepaths = []

  for (const env of determine(envs, process.env)) {
    if (env.type !== TYPE_ENV_FILE) {
      continue
    }

    const envFilepath = env.envFilepath || env.value
    const filepath = env.filepath || path.resolve(envFilepath)
    const row = { key, type: TYPE_ENV_FILE, filepath, envFilepath, changed: false }

    try {
      const encoding = await detectEncoding(filepath)
      const before = await fsx.readFileX(filepath, { encoding })
      const after = remove(before, key)

      row.envSrc = after
      if (after !== before) {
        row.changed = true
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

module.exports = delTransform
