const path = require('path')

const TYPE_ENV_FILE = 'envFile'

async function decrypt ({ envs = [] } = {}) {
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
      keys: [],
      type: TYPE_ENV_FILE,
      filepath,
      envFilepath,
      privateKey: env.privateKeyValue,
      privateKeyName: env.privateKeyName,
      changed: false,
      envSrc: env.envSrc
    }

    processedEnvs.push(row)
    unchangedFilepaths.push(envFilepath)
  }

  return {
    processedEnvs,
    changedFilepaths,
    unchangedFilepaths
  }
}

module.exports = decrypt
