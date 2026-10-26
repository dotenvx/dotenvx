const normalizeDotenvConfigPath = require('./normalizeDotenvConfigPath')
const buildCommandEnvs = require('./buildCommandEnvs')
const determine = require('./envResolution/determine')

module.exports = function selectEnvs (envs = [], options = {}, processEnv = process.env) {
  const configured = normalizeDotenvConfigPath(envs, processEnv)
  const resolved = options.resolveDirectories === false ? configured : buildCommandEnvs(configured, options.convention)
  return determine(resolved, processEnv)
}
