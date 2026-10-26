const envsResolver = require('./envs')
const Errors = require('./../helpers/errors')
const selectEnvs = require('../helpers/selectEnvs')

function collectErrors (processedEnvs) {
  const errors = []
  for (const processedEnv of processedEnvs) {
    for (const error of processedEnv.errors || []) {
      errors.push(error)
    }
  }
  return errors
}

function result ({ key, all, processedEnvs, processEnv }) {
  const errors = collectErrors(processedEnvs)

  if (key) {
    const parsed = {}
    const value = processEnv[key]
    parsed[key] = value

    if (value === undefined) {
      errors.push(new Errors({ key }).missingKey())
    }

    return { parsed, errors }
  }

  if (all) {
    return { parsed: processEnv, errors }
  }

  const parsed = {}
  for (const processedEnv of processedEnvs) {
    if (processedEnv.parsed) {
      for (const key of Object.keys(processedEnv.parsed)) {
        parsed[key] = processEnv[key]
      }
    }
  }

  return { parsed, errors }
}

function buildOptions (options, processEnv) {
  return {
    envs: selectEnvs(options.envs, options, processEnv),
    overload: options.overload,
    processEnv,
    envKeysFilepath: options.envKeysFilepath || options.envKeysFile || null,
    noArmor: options.noArmor,
    noNative: options.noNative,
    no1Password: options.no1Password,
    noBitwarden: options.noBitwarden,
    onStatus: options.onStatus
  }
}

async function get (options = {}) {
  const processEnv = { ...(options.processEnv || process.env) }
  const { processedEnvs } = await envsResolver(buildOptions(options, processEnv))

  return resolveResult(options, processedEnvs, processEnv)
}

function getSync (options = {}) {
  const processEnv = { ...(options.processEnv || process.env) }
  const { processedEnvs } = envsResolver.sync(buildOptions(options, processEnv))
  return resolveResult(options, processedEnvs, processEnv)
}

function resolveResult (options, processedEnvs, processEnv) {
  const resolved = result({
    key: options.key,
    all: options.all,
    processedEnvs,
    processEnv
  })
  if (options.includeKeySources) {
    resolved.keySources = Object.assign({}, ...processedEnvs.map(row => row.keySources))
  }
  return resolved
}

module.exports = get
module.exports.sync = getSync
