const { profile } = require('@dotenvx/primitives')
const readDotenvxfile = require('../dotenvxfile/parsing/readDotenvxfile')
const normalizeDotenvConfigPath = require('./normalizeDotenvConfigPath')
const buildCommandEnvs = require('./buildCommandEnvs')
const determine = require('./envResolution/determine')

module.exports = function selectDotenvxfileEnvs (envs = [], options = {}, processEnv = process.env) {
  const resolve = values => options.resolveDirectories === false ? values : buildCommandEnvs(values, options.convention)
  const document = readDotenvxfile.source()
  if (!document.exists) {
    if (options.profile !== undefined) throw new Error('Profile selection requires a Dotenvxfile')
    return determine(resolve(normalizeDotenvConfigPath(envs, processEnv)), processEnv)
  }
  // Keep explicit CLI file/inline-env ordering; profiles only supply file selection.
  const explicit = resolve(envs)
  const files = explicit.filter(env => env.type === 'envFile')
  let selected
  try {
    selected = profile(document.source, {
      f: files.length ? files.map(env => env.value).join(',') : undefined,
      profile: options.profile,
      processEnv
    })
  } catch (error) {
    throw readDotenvxfile.formatError(error, document)
  }
  if (files.length) return explicit
  return resolve((selected ? selected.split(',').map(value => ({ type: 'envFile', value })) : []).concat(explicit))
}
