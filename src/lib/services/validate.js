const envsResolver = require('../resolvers/envs')
const Session = require('../../db/session')
const buildCommandEnvs = require('../helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../helpers/resolveEnvKeysFile')
const readEnvfile = require('../envfile/parsing/readEnvfile')
const validateEnvfile = require('../envfile/validation/validateEnvfile')
const normalizeDotenvConfigPath = require('../helpers/normalizeDotenvConfigPath')
const Errors = require('../helpers/errors')
const { determine } = require('../helpers/envResolution')
const path = require('node:path')
const resolveDirectoryFilepath = require('../helpers/resolveDirectoryFilepath')

// Load once and validate the final values; callers own presentation and execution.
module.exports = async function validate ({ envs = [], options = {}, processEnv = { ...process.env }, requireEnvfile = true, command, onStatus, onKey } = {}) {
  envs = normalizeDotenvConfigPath(envs, processEnv)
  const requiredFilepaths = new Set(envs.filter(env => env.type === 'envFile').flatMap(env => {
    const resolved = resolveDirectoryFilepath(env.value, '.env')
    // A directory with a convention selects optional layers rather than one file.
    return options.convention && resolved !== env.value ? [] : [path.resolve(resolved)]
  }))
  envs = buildCommandEnvs(envs, options.convention)
  envs = determine(envs, processEnv)
  const schema = readEnvfile(undefined, envs.filter(env => env.type === 'envFile').map(env => env.value))
  if (requireEnvfile && !schema.exists) throw new Errors().envfileRequired()

  const session = new Session()
  const token = options.token || processEnv.DOTENVX_TOKEN
  const noArmor = options.armor === false || (!token && (await session.noArmor()))
  const { processedEnvs, readableFilepaths } = await envsResolver({
    envs,
    overload: options.overload,
    processEnv,
    envKeysFile: resolveEnvKeysFile(options.envKeysFile),
    noArmor,
    noNative: options.native === false || options.noNative === true,
    no1Password: options['1password'] === false || options.no1Password === true,
    noBitwarden: options.bitwarden === false || options.noBitwarden === true,
    lockPassword: options.lockPassword,
    token: options.token,
    command,
    onStatus
  })

  return {
    processEnv,
    processedEnvs,
    readableFilepaths,
    requiredFilepaths,
    hasEnvfile: schema.exists,
    schema,
    validationError: validateEnvfile(schema, processEnv, processedEnvs, onKey)
  }
}
