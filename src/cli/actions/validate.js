const { logger } = require('./../../shared/logger')

const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const prepareValidatedEnv = require('../../lib/services/validate')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')

async function validate () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(normalizeDotenvConfigQuiet(this.opts())))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'validating' })
  const ignore = options.ignore || []
  let errorCount = 0

  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const { processedEnvs, readableFilepaths, proxyError, validationError } = await prepareValidatedEnv({
      envs: this.envs,
      options,
      onStatus: (text) => {
        if (spinner && text) spinner.text = text
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

        if (error.code !== 'MISSING_ENV_FILE' || options.strict) errorCount += 1
        if (error.code === 'MISSING_ENV_FILE' && options.convention && !options.strict) continue
        logger.error(error.messageWithHelp || error.message)
      }
    }

    if (proxyError) {
      proxyError.message += ` ${sourceSummary}`
      throw proxyError
    }

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
