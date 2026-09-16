const { logger } = require('./../../shared/logger')

const envsResolver = require('./../../lib/resolvers/envs')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const buildCommandEnvs = require('../../lib/helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')
const readEnvfile = require('../../lib/helpers/readEnvfile')
const validateEnvfile = require('../../lib/helpers/validateEnvfile')
const normalizeDotenvConfigPath = require('../../lib/helpers/normalizeDotenvConfigPath')
const Errors = require('../../lib/helpers/errors')

const { determine } = require('./../../lib/helpers/envResolution')

async function validate () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(normalizeDotenvConfigQuiet(this.opts())))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'validating' })
  const ignore = options.ignore || []
  const validateEnv = { ...process.env }
  let errorCount = 0

  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const schema = readEnvfile()
    const { exists, proxyRules } = schema
    if (!exists) throw new Errors().missingEnvfile()

    let envs = buildCommandEnvs(normalizeDotenvConfigPath(this.envs), options.convention)
    envs = determine(envs, process.env)

    const sesh = new Session()
    const proxyToken = options.token || process.env.DOTENVX_TOKEN
    const noArmor = options.armor === false || (!proxyToken && (await sesh.noArmor()))
    if (proxyRules.size > 0 && noArmor) throw new Error('Envfile proxy requires Armor. Enable Armor and authenticate before running.')
    const proxyCredentials = noArmor ? undefined : []
    const noKeychain = options.native === false || options.noNative === true

    const { processedEnvs, readableFilepaths } = await envsResolver({
      envs,
      proxyRules,
      proxyCredentials,
      overload: options.overload,
      processEnv: validateEnv,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noKeychain,
      no1Password: options['1password'] === false || options.no1Password === true,
      noBitwarden: options.bitwarden === false || options.noBitwarden === true,
      token: options.token,
      onStatus: (text) => {
        if (spinner && text) {
          spinner.text = text
        }
      }
    })

    const sources = [...readableFilepaths]
    if (processedEnvs.some(env => env.type === 'env' && env.parsed)) sources.push('--env')
    if (sources.length === 0) sources.push('shell environment')
    const sourceSummary = `(${sources.join(', ')})`

    for (const processedEnv of processedEnvs) {
      for (const error of processedEnv.errors || []) {
        if (ignore.includes(error.code)) {
          logger.verbose(`ignored: ${error.message}`)
          continue
        }

        errorCount += 1
        logger.error(error.messageWithHelp || error.message)
      }
    }

    for (const name of proxyRules.keys()) {
      if (validateEnv[name] !== undefined && !(proxyCredentials || []).some(credential => credential.name === name && credential.placeholder === validateEnv[name])) {
        throw new Error(`Envfile proxy requires an encrypted ${name} loaded from an env file. Remove plaintext or shell overrides, or use --overload. ${sourceSummary}`)
      }
    }

    const validationError = validateEnvfile(schema, validateEnv, processedEnvs)
    if (validationError) {
      const message = `${validationError.message} ${sourceSummary}`
      if (ignore.includes(validationError.code)) {
        logger.verbose(`ignored: ${message}`)
      } else {
        errorCount += 1
        logger.error(message)
      }
    }

    if (spinner) spinner.stop()

    if (errorCount > 0) {
      process.exit(1)
    } else {
      logger.success(`▣ valid ${sourceSummary}`)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = validate
