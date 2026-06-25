const path = require('path')
const { logger } = require('./../../shared/logger')

const executeCommand = require('./../../lib/helpers/executeCommand')
const Run = require('./../../lib/services/run')
const catchAndLog = require('./../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')

const conventions = require('./../../lib/helpers/conventions')
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

async function run () {
  const options = normalizeArmorAliases(this.opts())

  let commandArgs = this.args
  if (commandArgs.length < 1) {
    commandArgs = inferCommandArgsFromProcessArgv(process.argv)
  }

  const spinner = await createSpinner({ ...options, text: 'injecting' })

  logger.debug(`options: ${JSON.stringify(options)}`)
  logger.debug(`process command [${commandArgs.join(' ')}]`)

  const ignore = options.ignore || []

  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))

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
    let envs = []
    // handle shorthand conventions - like --convention=nextjs
    if (options.convention) {
      envs = conventions(options.convention).concat(this.envs)
    } else {
      envs = this.envs
    }
    envs = determine(envs, process.env)
    if (spinner) spinner.stop()

    const {
      processedEnvs,
      readableStrings,
      readableFilepaths,
      uniqueInjectedKeys
    } = await new Run(envs, options.overload, process.env, options.envKeysFile, noArmor, {
      token: options.token,
      command: commandArgs
    }).run()

    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envFile') {
        logger.verbose(`loading env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.type === 'env') {
        logger.verbose(`loading env from string (${processedEnv.string})`)
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
          logger.error(error.messageWithHelp)
        }
      }

      // debug parsed
      logger.debug(processedEnv.parsed)

      // verbose/debug injected key/value
      for (const [key, value] of Object.entries(processedEnv.injected || {})) {
        logger.verbose(`${key} set`)
        logger.debug(`${key} set to ${value}`)
      }

      // verbose/debug preExisted key/value
      for (const [key, value] of Object.entries(processedEnv.preExisted || {})) {
        logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
        logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
      }
    }

    let msg = `injected env (${uniqueInjectedKeys.length})`
    if (readableFilepaths.length > 0 && readableStrings.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}, and --env flag${readableStrings.length > 1 ? 's' : ''}`
    } else if (readableFilepaths.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}`
    } else if (readableStrings.length > 0) {
      msg += ` from --env flag${readableStrings.length > 1 ? 's' : ''}`
    }

    const armoredPrivateKeyUsed = processedEnvs.some((processedEnv) => processedEnv.armoredPrivateKeyUsed)
    const keyUsedSuffix = armoredPrivateKeyUsed ? ' · armored ⛨' : ''

    if (spinner) spinner.stop()
    logger.success(`⟐ ${msg}${keyUsedSuffix}`)
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }

  await executeCommand(commandArgs, process.env)
}

module.exports = run
