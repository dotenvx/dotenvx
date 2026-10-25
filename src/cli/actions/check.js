const path = require('node:path')
const statusReporter = require('../../lib/helpers/statusReporter')
const { logger } = require('./../../shared/logger')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const prepareValidatedEnv = require('../../lib/services/validate')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const previewEnvfile = require('../../lib/envfile/rendering/previewEnvfile')

async function check () {
  if (this.opts().init) return require('./init').call(this)
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(normalizeDotenvConfigQuiet(this.opts())))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'checking', ...(process.env.CI ? { spinner: false } : {}) })
  const ignore = options.ignore || []
  let errorCount = 0
  let validationCount = 0
  const messages = []
  const report = (level, message) => messages.push({ level, message })
  const flush = () => {
    if (spinner) spinner.stop()
    for (const { level, message } of messages.splice(0)) logger[level](message)
  }

  try {
    const { processedEnvs, validationError, schema, checked: checkedValues } = await prepareValidatedEnv({
      envs: this.envs,
      options,
      onStatus: statusReporter(spinner)
    })
    for (const row of processedEnvs) {
      for (const error of row.errors || []) {
        if (ignore.includes(error.code)) continue
        if (options.strict) errorCount++
        else if (error.code === 'MISSING_ENV_FILE' && options.convention) continue
        report('error', error.messageWithHelp || error.message)
      }
    }
    if (validationError && !ignore.includes(validationError.code)) {
      for (const diagnostic of validationError.diagnostics) {
        const fatal = options.strict || diagnostic.strict
        validationCount++
        if (fatal) errorCount++
      }
    }

    flush()
    if (!options.quiet) {
      const diagnostics = validationError && !ignore.includes(validationError.code) ? validationError.diagnostics : []
      for (const line of previewEnvfile(processedEnvs, schema, checkedValues, diagnostics)) {
        logger.verbose(line)
      }
    }
    if (validationCount > 0) {
      logger.error(validationError.messageWithHelp || validationError.message)
      return { exitCode: errorCount > 0 ? 1 : 0 }
    }
    if (errorCount > 0) return { exitCode: 1 }
    logger.success(`◈ valid env per ${path.basename(schema.filepath)} ϟ`)
  } catch (error) {
    flush()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
