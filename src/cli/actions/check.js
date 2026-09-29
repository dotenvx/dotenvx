const { logger } = require('./../../shared/logger')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const prepareValidatedEnv = require('../../lib/services/validate')
const diagnosticLocations = require('../../lib/envspec/validation/diagnosticLocation')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const path = require('node:path')
const previewEnvspec = require('../../lib/envspec/rendering/previewEnvspec')

async function check () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(normalizeDotenvConfigQuiet(this.opts())))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'checking', ...(process.env.CI ? { spinner: false } : {}) })
  const ignore = options.ignore || []
  const showPreview = !options.quiet && !['error', 'infoerror', 'warn'].includes(logger.level)
  let errorCount = 0
  const checked = []
  const messages = []
  const report = (level, message) => messages.push({ level, message })
  const flush = () => {
    if (spinner) spinner.stop()
    for (const { level, message } of messages.splice(0)) logger[level](message)
  }

  try {
    const { processedEnvs, readableFilepaths, requiredFilepaths, proxyError, validationError, schema, processEnv, proxyCredentials } = await prepareValidatedEnv({
      envs: this.envs,
      options,
      onStatus: text => { if (spinner && text) spinner.text = text },
      onKey: key => { if (spinner) spinner.text = `checking ${key}` }
    })
    checked.push(...readableFilepaths)
    if (processedEnvs.some(row => row.type === 'env' && Object.keys(row.parsed || {}).length)) checked.push('--env')
    if (checked.length === 0 && [...schema.redactionRules.keys()].some(key => processEnv[key] !== undefined)) checked.push('shell environment')
    const location = diagnosticLocations(processedEnvs, checked.join(', ') || 'Envspec')
    for (const row of processedEnvs) {
      for (const error of row.errors || []) {
        if (ignore.includes(error.code)) continue
        if (error.code === 'MISSING_ENV_FILE' && !requiredFilepaths.has(path.resolve(row.filepath))) {
          report('infoerror', `○ skipped (${row.filepath})`)
          continue
        }
        errorCount++
        report('error', error.messageWithHelp || error.message)
      }
    }
    if (proxyError) {
      errorCount++
      report('error', proxyError.message)
    }
    if (validationError && !ignore.includes(validationError.code)) {
      errorCount++
      for (const diagnostic of showPreview ? [] : validationError.diagnostics) {
        const message = diagnostic.message.replace(`${diagnostic.key} is `, `${diagnostic.key} `)
        report('error', `${message} (${location(diagnostic.key)})`)
      }
    }

    if (spinner) spinner.stop()
    if (showPreview) {
      const diagnostics = validationError && !ignore.includes(validationError.code) ? validationError.diagnostics : []
      const preview = previewEnvspec(processedEnvs, schema, processEnv, proxyCredentials, diagnostics)
      if (preview) {
        for (const line of preview.split('\n')) logger.info(line)
      }
    }
    flush()
    if (checked.length === 0) {
      logger.error('no environment sources found to check')
      return { exitCode: 1 }
    }
    if (errorCount > 0) return { exitCode: 1 }
  } catch (error) {
    flush()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
