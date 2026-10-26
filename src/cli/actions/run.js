const statusReporter = require('../../lib/helpers/statusReporter')
const path = require('path')
const { injectsummary, publickeys } = require('@dotenvx/primitives')
const { logger } = require('./../../shared/logger')

const executeCommand = require('./../../lib/helpers/executeCommand')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const envsResolver = require('../../lib/resolvers/envs')
const normalizeDotenvConfigPath = require('../../lib/helpers/normalizeDotenvConfigPath')
const buildCommandEnvs = require('../../lib/helpers/buildCommandEnvs')
const determine = require('../../lib/helpers/envResolution/determine')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')
const Session = require('../../db/session')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const mask = require('../../lib/helpers/mask')
const maskEnvSrc = require('../../lib/helpers/maskEnvSrc')
const maskProcessedEnvs = require('../../lib/helpers/maskProcessedEnvs')
const redactedValues = require('../../lib/helpers/redactedValues')
const { redactOutput } = require('../../lib/helpers/redactOutput')

function inferCommandArgsFromProcessArgv (argv) {
  const runIndex = argv.indexOf('run')
  if (runIndex === -1) return []

  const args = argv.slice(runIndex + 1)

  const separatorIndex = args.indexOf('--')
  if (separatorIndex !== -1) return args.slice(separatorIndex + 1)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--file' || args[i] === '--env-file') {
      i++
      continue
    }

    if (args[i].startsWith('-')) continue

    return args.slice(i)
  }

  return []
}

function uniqueInjectedKeys (processedEnvs) {
  const result = new Set()
  for (const processedEnv of processedEnvs) {
    for (const key of Object.keys(processedEnv.injected || {})) {
      result.add(key)
    }
  }
  return result
}

async function run () {
  const options = normalizeDotenvConfigIgnore(normalizeDotenvConfigConvention(normalizeDotenvConfigQuiet(this.opts())))
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options
  const maskEnabled = options.mask !== undefined
  let showChar = options.mask
  if (options.mask === true) {
    showChar = 6
  }
  let commandEnv = process.env
  let sensitiveValues = []

  let commandArgs = this.args
  if (commandArgs.length < 1) {
    commandArgs = inferCommandArgsFromProcessArgv(process.argv)
  }

  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: 'injecting' })

  let debugOptions = options
  if (maskEnabled) {
    let token = options.token
    if (options.token) {
      token = mask(options.token, showChar)
    }

    debugOptions = { ...options, env: (options.env || []).map(envSrc => maskEnvSrc(envSrc, showChar)), token }
  }

  const ignore = options.ignore || []

  if (commandArgs.length < 1) {
    if (spinner) spinner.stop()

    const hasSeparator = process.argv.indexOf('--') !== -1

    if (hasSeparator) {
      logger.error('missing command after [dotenvx run --]. try [dotenvx run -- yourcommand]')
    } else {
      const realExample = options.envFile[0] || '.env'
      logger.error(`ambiguous command due to missing '--' separator. try [dotenvx run -f ${realExample} -- yourcommand]`)
    }

    return { exitCode: 1 }
  }

  try {
    const envs = determine(buildCommandEnvs(normalizeDotenvConfigPath(this.envs, process.env), options.convention), process.env)
    const session = new Session()
    const noArmor = options.armor === false || (!(options.token || process.env.DOTENVX_TOKEN) && (await session.noArmor()))
    const { processedEnvs, readableFilepaths } = await envsResolver({
      envs,
      overload: options.overload,
      processEnv: process.env,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noNative: options.native === false || options.noNative === true,
      no1Password: options['1password'] === false || options.no1Password === true,
      noBitwarden: options.bitwarden === false || options.noBitwarden === true,
      token: options.token,
      command: commandArgs,
      onStatus: statusReporter(spinner)
    })

    if (options.redact === true) {
      sensitiveValues = redactedValues(processedEnvs)
    }

    logger.debug(redactOutput(`options: ${JSON.stringify(debugOptions)}`, sensitiveValues))
    logger.debug(redactOutput(`process command [${commandArgs.join(' ')}]`, sensitiveValues))

    if (maskEnabled) {
      commandEnv = { ...process.env }
      maskProcessedEnvs(processedEnvs, commandEnv, showChar)
    }

    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envFile') {
        logger.verbose(`loading env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.type === 'env') {
        let envString = processedEnv.string
        if (maskEnabled) {
          envString = maskEnvSrc(processedEnv.string, showChar)
        }
        logger.verbose(redactOutput(`loading env from string (${envString})`, sensitiveValues))
      }

      for (const error of processedEnv.errors || []) {
        if (ignore.includes(error.code)) {
          logger.verbose(`ignored: ${error.message}`)
          continue // ignore error
        }

        if (options.strict) throw error // file-loading failures use the CLI strict flag

        if (error.code === 'MISSING_ENV_FILE' && options.convention) { // do not output error for conventions (too noisy)
          // intentionally quiet
        } else {
          logger.error(error.messageWithHelp || error.message)
        }
      }

      // debug parsed
      logger.debug(redactOutput(processedEnv.parsed, sensitiveValues))

      // verbose/debug injected key/value
      for (const [key, value] of Object.entries(processedEnv.injected || {})) {
        logger.verbose(`${key} set`)
        logger.debug(redactOutput(`${key} set to ${value}`, sensitiveValues))
      }

      // verbose/debug existed key/value
      for (const [key, value] of Object.entries(processedEnv.existed || {})) {
        logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
        logger.debug(redactOutput(`${key} pre-exists as ${value} (protip: use --overload to override)`, sensitiveValues))
      }
    }

    const injectedKeys = uniqueInjectedKeys(processedEnvs)

    if (spinner) spinner.stop()
    const summaryRows = readableFilepaths.map(filepath => {
      const row = processedEnvs.find(row => row.filepath === filepath)
      return {
        filepath,
        publicKeys: row ? publickeys(row.src || '') : [],
        keySources: row && row.keySources
      }
    })
    logger.success(injectsummary(injectedKeys.size, summaryRows))
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.code === 'PROMPT_CANCELLED') {
      return { exitCode: 130, error }
    }
    catchAndLog(error)
    return { exitCode: 1, error }
  }

  return executeCommand(commandArgs, commandEnv, sensitiveValues)
}

module.exports = require('../../lib/events/cli')('run', run)
