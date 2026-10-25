const envsResolver = require('../resolvers/envs')
const Session = require('../../db/session')
const selectEnvarmorEnvs = require('../helpers/selectEnvarmorEnvs')
const normalizeDotenvConfigPath = require('../helpers/normalizeDotenvConfigPath')
const resolveEnvKeysFile = require('../helpers/resolveEnvKeysFile')
const readEnvarmor = require('../envarmor/parsing/readEnvarmor')
const checkResolvedEnv = require('../envarmor/validation/checkResolvedEnv')
const createValidationError = require('../helpers/createValidationError')
const Errors = require('../helpers/errors')
const path = require('node:path')
const resolveDirectoryFilepath = require('../helpers/resolveDirectoryFilepath')

// Load once and validate the final values; callers own presentation and execution.
module.exports = async function validate ({ envs = [], options = {}, processEnv = { ...process.env }, requireEnvarmor = true, command, onStatus } = {}) {
  const explicitEnvs = options.profile ? envs : normalizeDotenvConfigPath(envs, processEnv)
  const requiredFilepaths = new Set(explicitEnvs.filter(env => env.type === 'envFile').flatMap(env => {
    const resolved = resolveDirectoryFilepath(env.value, '.env')
    // A directory with a convention selects optional layers rather than one file.
    return options.convention && resolved !== env.value ? [] : [path.resolve(resolved)]
  }))
  envs = selectEnvarmorEnvs(envs, options, processEnv)
  const schema = readEnvarmor(undefined, envs.filter(env => env.type === 'envFile').map(env => env.value))
  if (requireEnvarmor && !schema.exists) throw new Errors().envarmorRequired()

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
  const result = checkResolvedEnv(schema, finalEnv, processedEnvs)

  return {
    processEnv,
    processedEnvs,
    readableFilepaths,
    requiredFilepaths,
    hasEnvarmor: schema.exists,
    schema,
    checked: result.checked,
    validationError: createValidationError(result.errors)
  }
}
