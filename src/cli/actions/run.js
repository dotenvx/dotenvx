const path = require('path')
const { logger } = require('./../../shared/logger')

const executeCommand = require('./../../lib/helpers/executeCommand')
const envsResolver = require('./../../lib/resolvers/envs')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeDotenvConfigQuiet = require('../../lib/helpers/normalizeDotenvConfigQuiet')
const normalizeDotenvConfigConvention = require('../../lib/helpers/normalizeDotenvConfigConvention')
const normalizeDotenvConfigIgnore = require('../../lib/helpers/normalizeDotenvConfigIgnore')
const normalizeDotenvConfigEnvFile = require('../../lib/helpers/normalizeDotenvConfigEnvFile')
const buildCommandEnvs = require('../../lib/helpers/buildCommandEnvs')
const resolveEnvKeysFile = require('../../lib/helpers/resolveEnvKeysFile')
const mask = require('../../lib/helpers/mask')
const maskEnvSrc = require('../../lib/helpers/maskEnvSrc')
const maskProcessedEnvs = require('../../lib/helpers/maskProcessedEnvs')
const redactedValues = require('../../lib/helpers/redactedValues')
const { redactOutput } = require('../../lib/helpers/redactOutput')
const validateEnvExample = require('../../lib/helpers/validateEnvExample')

const { determine } = require('./../../lib/helpers/envResolution')

function inferCommandArgsFromProcessArgv (argv) {
  const runIndex = argv.indexOf('run')
  if (runIndex === -1) return []

  const args = argv.slice(runIndex + 1)

  const separatorIndex = args.indexOf('--')
  if (separatorIndex !== -1) return args.slice(separatorIndex + 1)

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-f' || args[i] === '--env-file') {
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
  const redactEnabled = options.redact === true
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
  logger.debug(`options: ${JSON.stringify(debugOptions)}`)
  logger.debug(`process command [${commandArgs.join(' ')}]`)

  const ignore = options.ignore || []

  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))
  const noKeychain = options.native === false || options.noNative === true

  if (commandArgs.length < 1) {
    if (spinner) spinner.stop()

    const hasSeparator = process.argv.indexOf('--') !== -1

    if (hasSeparator) {
      logger.error('missing command after [dotenvx run --]. try [dotenvx run -- yourcommand]')
    } else {
      const realExample = options.envFile[0] || '.env'
      logger.error(`ambiguous command due to missing '--' separator. try [dotenvx run -f ${realExample} -- yourcommand]`)
    }

    process.exit(1)
  }

  try {
    let envs = buildCommandEnvs(normalizeDotenvConfigEnvFile(this.envs), options.convention)
    envs = determine(envs, process.env)

    const {
      processedEnvs,
      readableFilepaths
    } = await envsResolver({
      envs,
      overload: options.overload,
      processEnv: process.env,
      envKeysFile: resolveEnvKeysFile(options.envKeysFile),
      noArmor,
      noKeychain,
      no1Password: options['1password'] === false || options.no1Password === true,
      noBitwarden: options.bitwarden === false || options.noBitwarden === true,
      token: options.token,
      command: commandArgs,
      onStatus: (text) => {
        if (spinner && text) {
          spinner.text = text
        }
      }
    })

    if (redactEnabled) {
      sensitiveValues = redactedValues(processedEnvs)
    }

    if (maskEnabled) {
      commandEnv = { ...process.env }
      maskProcessedEnvs(processedEnvs, commandEnv, showChar)
    }

    if (options.validate) {
      const error = validateEnvExample(process.env)

      if (error) {
        if (ignore.includes(error.code)) {
          logger.verbose(`ignored: ${error.message}`)
        } else if (options.strict) {
          throw error
        } else {
          logger.error(error.messageWithHelp || error.message)
        }
      }
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
        logger.verbose(`loading env from string (${envString})`)
      }

      for (const error of processedEnv.errors || []) {
        if (ignore.includes(error.code)) {
          logger.verbose(`ignored: ${error.message}`)
          continue // ignore error
        }

        if (options.strict) throw error // throw if strict and not ignored

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

    let msg = `injected env (${uniqueInjectedKeys(processedEnvs).size})`
    const envStringCount = processedEnvs.filter((processedEnv) => processedEnv.type === 'env' && processedEnv.parsed).length
    if (readableFilepaths.length > 0 && envStringCount > 0) {
      msg += ` from ${readableFilepaths.join(', ')}, and --env flag${envStringCount > 1 ? 's' : ''}`
    } else if (readableFilepaths.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}`
    } else if (envStringCount > 0) {
      msg += ` from --env flag${envStringCount > 1 ? 's' : ''}`
    }

    if (spinner) spinner.stop()
    logger.success(`⟐ ${msg}`)
  } catch (error) {
    if (spinner) spinner.stop()
    if (error.code === 'PROMPT_CANCELLED') {
      process.exit(130)
      return
    }
    catchAndLog(error)
    process.exit(1)
  }

  await executeCommand(commandArgs, commandEnv, sensitiveValues)
}

module.exports = run
