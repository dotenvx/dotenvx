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

function result ({ key, all }, processedEnvs, processEnv) {
  const errors = collectErrors(processedEnvs)
  const parsed = {}
  const custodies = Object.assign({}, ...processedEnvs.map(row => row.custodies))
  const resolved = { parsed, errors, custodies }

  if (key) {
    const value = processEnv[key]
    parsed[key] = value

    if (value === undefined) {
      errors.push(new Errors({ key }).missingKey())
    }

    return resolved
  }

  if (all) {
    resolved.parsed = processEnv
    return resolved
  }

  for (const row of processedEnvs) {
    for (const key of Object.keys(row.parsed || {})) {
      parsed[key] = processEnv[key]
    }
  }

  // todo: here try to pull in policy keys somehow

  return resolved
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
  // builds in memory processedEnvs
  // {
  //   processedEnvs: [
  //     {
  //       type: 'envFile',
  //       filepath: '.env',
  //       src: 'HELLO=World\n',
  //       parsed: {
  //         HELLO: 'World'
  //       },
  //       injected: {
  //         HELLO: 'World',
  //       },
  //       existed: {},
  //       custodies: {},
  //       errors: []
  //     }
  //   ],
  //   readableFilepaths: ['.env']
  // }
  //
  // 'injected' here communicate it was written to processEnv object

  return result(options, processedEnvs, processEnv)
}

function getSync (options = {}) {
  const processEnv = { ...(options.processEnv || process.env) }
  const { processedEnvs } = envsResolver.sync(buildOptions(options, processEnv))
  return result(options, processedEnvs, processEnv)
}

module.exports = get
module.exports.sync = getSync
