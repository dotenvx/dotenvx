const { profile } = require('@dotenvx/primitives')
const readEnvfile = require('../envfile/parsing/readEnvfile')
const normalizeDotenvConfigPath = require('./normalizeDotenvConfigPath')
const buildCommandEnvs = require('./buildCommandEnvs')
const determine = require('./envResolution/determine')

module.exports = function selectEnvfileEnvs (envs = [], options = {}, processEnv = process.env) {
  const document = readEnvfile.source()
  if (!document.exists) {
    if (options.profile !== undefined) throw new Error('Profile selection requires an Envfile')
    return determine(buildCommandEnvs(normalizeDotenvConfigPath(envs, processEnv), options.convention), processEnv)
  }
  // Keep explicit CLI file/inline-env ordering; profiles only supply file selection.
  const explicit = buildCommandEnvs(envs, options.convention)
  const files = explicit.filter(env => env.type === 'envFile')
  let selected
  try {
    selected = profile(document.source, {
      f: files.length ? files.map(env => env.value).join(',') : undefined,
      profile: options.profile,
      processEnv
    })
  } catch (error) {
    throw readEnvfile.formatError(error, document)
  }
  if (files.length) return explicit
  return buildCommandEnvs((selected ? selected.split(',').map(value => ({ type: 'envFile', value })) : []).concat(explicit))
}
