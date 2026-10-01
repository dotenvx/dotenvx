const envsResolver = require('../resolvers/envs')
const Session = require('../../db/session')
const buildCommandEnvs = require('../helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../helpers/resolveEnvKeysFile')
const readEnvspec = require('../envspec/parsing/readEnvspec')
const validateEnvspec = require('../envspec/validation/validateEnvspec')
const normalizeDotenvConfigPath = require('../helpers/normalizeDotenvConfigPath')
const Errors = require('../helpers/errors')
const { determine } = require('../helpers/envResolution')
const path = require('node:path')
const resolveDirectoryFilepath = require('../helpers/resolveDirectoryFilepath')

// Load once and validate the final values; callers own presentation and execution.
module.exports = async function validate ({ envs = [], options = {}, processEnv = { ...process.env }, requireEnvspec = true, command, onStatus, onKey } = {}) {
  envs = normalizeDotenvConfigPath(envs, processEnv)
  const requiredFilepaths = new Set(envs.filter(env => env.type === 'envFile').flatMap(env => {
    const resolved = resolveDirectoryFilepath(env.value, '.env')
    // A directory with a convention selects optional layers rather than one file.
    return options.convention && resolved !== env.value ? [] : [path.resolve(resolved)]
  }))
  envs = buildCommandEnvs(envs, options.convention)
  envs = determine(envs, processEnv)
  const schema = readEnvspec(undefined, envs.filter(env => env.type === 'envFile').map(env => env.value))
  if (requireEnvspec && !schema.exists) throw new Errors().envspecRequired()

  const session = new Session()
  const proxyToken = options.token || processEnv.DOTENVX_TOKEN
  const noArmor = options.armor === false || (!proxyToken && (await session.noArmor()))
  if (schema.proxyRules.size > 0 && noArmor) throw new Error('Envfile proxy requires Armor. Enable Armor and authenticate before running.')
  const proxyCredentials = noArmor ? undefined : []
  const { processedEnvs, readableFilepaths } = await envsResolver({
    envs,
    proxyRules: schema.proxyRules,
    proxyCredentials,
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

  let proxyError
  for (const name of schema.proxyRules.keys()) {
    if (processEnv[name] !== undefined && !(proxyCredentials || []).some(credential => credential.name === name && credential.placeholder === processEnv[name])) {
      proxyError = new Error(`Envfile proxy requires an encrypted ${name} loaded from an env file. Remove plaintext or shell overrides, or use --overload.`)
      break
    }
  }

  return {
    processEnv,
    processedEnvs,
    readableFilepaths,
    requiredFilepaths,
    hasEnvspec: schema.exists,
    schema,
    proxyCredentials,
    proxyToken,
    session,
    proxyError,
    validationError: validateEnvspec(schema, processEnv, processedEnvs, onKey)
  }
}
