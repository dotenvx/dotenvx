const envsResolver = require('../resolvers/envs')
const Session = require('../../db/session')
const buildCommandEnvs = require('../helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../helpers/resolveEnvKeysFile')
const readEnvfile = require('../helpers/readEnvfile')
const validateEnvfile = require('../helpers/validateEnvfile')
const normalizeDotenvConfigPath = require('../helpers/normalizeDotenvConfigPath')
const Errors = require('../helpers/errors')
const { determine } = require('../helpers/envResolution')

// Load once and validate the final values; callers own presentation and execution.
module.exports = async function validate ({ envs = [], options = {}, processEnv = { ...process.env }, requireEnvfile = true, command, onStatus } = {}) {
  envs = buildCommandEnvs(normalizeDotenvConfigPath(envs, processEnv), options.convention)
  envs = determine(envs, processEnv)
  const schema = readEnvfile(undefined, envs.filter(env => env.type === 'envFile').map(env => env.value))
  if (requireEnvfile && !schema.exists) throw new Errors().envfileRequired()

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
    hasEnvfile: schema.exists,
    proxyCredentials,
    proxyToken,
    session,
    proxyError,
    validationError: validateEnvfile(schema, processEnv, processedEnvs)
  }
}
