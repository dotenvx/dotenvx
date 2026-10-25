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
  if (this.opts().init) return initializeSuperenv.call(this)
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

async function initializeSuperenv () {
  const fs = require('node:fs')
  const process = require('node:process')
  const prompts = require('../../lib/helpers/prompts')
  const initEnvfile = require('../../lib/services/init')
  const scanSource = require('../../lib/envfile/discovery/scanSource')
  const discoverEnvFiles = require('../../lib/envfile/discovery/discoverEnvFiles')
  const options = this.opts()
  const envFile = Array.isArray(options.envFile) ? undefined : options.envFile
  const overwrite = options.overwrite === true
  const stdout = options.stdout === true
  const interactive = !process.env.CI && process.stdin.isTTY && process.stderr.isTTY
  let spinner

  try {
    const existing = stdout ? undefined : fs.lstatSync('Superenv', { throwIfNoEntry: false })
    if (existing && !overwrite) {
      logger.info('○ Superenv already exists [edit or run: dotenvx check --init --overwrite]')
      return
    }
    if (existing && !existing.isFile()) throw new Error('Cannot replace Superenv: expected a regular file')

    let envFiles = Array.isArray(options.envFile) && options.envFile.length ? options.envFile : undefined
    let sourceKeys = []
    let scanCode = false
    const onFile = filename => {
      if (spinner) spinner.text = `scanning ${filename}`
    }
    if (interactive && !envFile && !envFiles) {
      const candidates = discoverEnvFiles()
      const selected = await prompts.multiselect({
        message: existing ? 'Recreate Superenv from .env files and code' : 'Create Superenv from .env files and code',
        submitLabel: existing ? 'Recreate Superenv' : 'Create Superenv',
        choices: [...candidates, { name: 'code ./**/* (env references)', value: '__scan_source' }],
        initial: [...candidates, '__scan_source']
      })
      envFiles = selected.filter(value => value !== '__scan_source')
      scanCode = selected.includes('__scan_source')
    }

    const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
    spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'scanning' })
    if (scanCode) {
      const { keys } = await scanSource({ onFile })
      sourceKeys = keys
    }

    const { created, replaced, content } = initEnvfile({ envFile, envFiles, sourceKeys, overwrite, stdout, onFile })
    if (spinner) spinner.stop()
    if (stdout) {
      process.stdout.write(content)
      return
    }
    if (created) {
      logger.success(replaced ? '◈ recreated Superenv ϟ' : '◈ created Superenv ϟ')
      logger.help('⮕ next run [dotenvx check]')
    } else logger.info('○ Superenv already exists [edit or run: dotenvx check --init --overwrite]')
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = check
