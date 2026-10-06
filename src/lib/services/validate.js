const envsResolver = require('../resolvers/envs')
const Session = require('../../db/session')
const selectEnvfileEnvs = require('../helpers/selectEnvfileEnvs')
const normalizeDotenvConfigPath = require('../helpers/normalizeDotenvConfigPath')
const resolveEnvKeysFile = require('../helpers/resolveEnvKeysFile')
const readEnvfile = require('../envfile/parsing/readEnvfile')
const validateEnvfile = require('../envfile/validation/validateEnvfile')
const Errors = require('../helpers/errors')
const path = require('node:path')
const resolveDirectoryFilepath = require('../helpers/resolveDirectoryFilepath')

// Load once and validate the final values; callers own presentation and execution.
module.exports = async function validate ({ envs = [], options = {}, processEnv = { ...process.env }, requireEnvfile = true, command, onStatus } = {}) {
  const explicitEnvs = options.profile ? envs : normalizeDotenvConfigPath(envs, processEnv)
  const requiredFilepaths = new Set(explicitEnvs.filter(env => env.type === 'envFile').flatMap(env => {
    const resolved = resolveDirectoryFilepath(env.value, '.env')
    // A directory with a convention selects optional layers rather than one file.
    return options.convention && resolved !== env.value ? [] : [path.resolve(resolved)]
  }))
  envs = selectEnvfileEnvs(envs, options, processEnv)
  const schema = readEnvfile(undefined, envs.filter(env => env.type === 'envFile').map(env => env.value))
  if (requireEnvfile && !schema.exists) throw new Errors().envfileRequired()

  const session = new Session()
  const noArmor = options.armor === false || (!(options.token || processEnv.DOTENVX_TOKEN) && (await session.noArmor()))
  const { processedEnvs, readableFilepaths } = await envsResolver({
    envs,
    overload: options.overload,
    processEnv,
    envKeysFile: resolveEnvKeysFile(options.envKeysFile),
    noArmor,
    noNative: options.native === false || options.noNative === true,
    no1Password: options['1password'] === false || options.no1Password === true,
    noBitwarden: options.bitwarden === false || options.noBitwarden === true,
    token: options.token,
    command,
    onStatus
  })

  const keys = new Set([
    ...Object.keys(schema.keys),
    ...processedEnvs.flatMap(row => Object.keys(row.parsed || {}))
  ])
  const finalEnv = Object.fromEntries([...keys].filter(key => Object.hasOwn(processEnv, key)).map(key => [key, processEnv[key]]))
  const result = validateEnvfile(schema, finalEnv)

  return {
    processEnv,
    processedEnvs,
    readableFilepaths,
    requiredFilepaths,
    hasEnvfile: schema.exists,
    schema,
    checked: result.checked,
    validationError: validateEnvfile.error(result.errors)
  }
}
