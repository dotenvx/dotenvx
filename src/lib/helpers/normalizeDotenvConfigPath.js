const TYPE_ENV_FILE = 'envFile'

function normalizeDotenvConfigPath (envs = [], processEnv = process.env) {
  if (envs.some(env => env.type === TYPE_ENV_FILE)) return envs

  const configuredEnvFiles = processEnv.DOTENV_F || processEnv.DOTENV_PATH
  if (!configuredEnvFiles) return envs

  const envFiles = configuredEnvFiles.split(',').map(value => value.trim()).filter(Boolean)

  return envFiles.map(value => ({ type: TYPE_ENV_FILE, value })).concat(envs)
}

module.exports = normalizeDotenvConfigPath
