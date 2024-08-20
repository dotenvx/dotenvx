const path = require('path')
const { logger } = require('./../../shared/logger')

const executeCommand = require('./../../lib/helpers/executeCommand')
const Run = require('./../../lib/services/run')

const conventions = require('./../../lib/helpers/conventions')

async function run () {
  const commandArgs = this.args
  logger.debug(`process command [${commandArgs.join(' ')}]`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    let envs = []
    // handle shorthand conventions - like --convention=nextjs
    if (options.convention) {
      envs = conventions(options.convention).concat(this.envs)
    } else {
      envs = this.envs
    }

    if (process.env.DOTENV_KEY) {
      logger.warn('DEPRECATION NOTICE: Setting DOTENV_KEY with .env.vault is deprecated.')
      logger.warn('DEPRECATION NOTICE: Run [dotenvx ext vault migrate] for instructions on converting your .env.vault file to encrypted .env files (using public key encryption algorithm secp256k1)')
      logger.warn('DEPRECATION NOTICE: Read more at [https://github.com/dotenvx/dotenvx/blob/main/CHANGELOG.md#0380]')
    }

    const {
      processedEnvs,
      readableStrings,
      readableFilepaths,
      uniqueInjectedKeys
    } = new Run(envs, options.overload, process.env.DOTENV_KEY).run()

    for (const processedEnv of processedEnvs) {
      if (processedEnv.type === 'envVaultFile') {
        logger.verbose(`loading env from encrypted ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
        logger.debug(`decrypting encrypted env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.type === 'envFile') {
        logger.verbose(`loading env from ${processedEnv.filepath} (${path.resolve(processedEnv.filepath)})`)
      }

      if (processedEnv.type === 'env') {
        logger.verbose(`loading env from string (${processedEnv.string})`)
      }

      if (processedEnv.error) {
        if (processedEnv.error.code === 'MISSING_ENV_FILE') {
          // do not warn for conventions (too noisy)
          if (!options.convention) {
            logger.warnv(processedEnv.error.message)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.filepath}] and re-run [dotenvx run -- ${commandArgs.join(' ')}]`)
          }
        } else {
          logger.warnv(processedEnv.error.message)
        }
      } else {
        if (processedEnv.warnings) {
          for (const warning of processedEnv.warnings) {
            logger.warn(warning.message)
            if (warning.help) {
              logger.help(warning.help)
            }
          }
        }

        // debug parsed
        const parsed = processedEnv.parsed
        logger.debug(parsed)

        // verbose/debug injected key/value
        const injected = processedEnv.injected
        for (const [key, value] of Object.entries(injected)) {
          logger.verbose(`${key} set`)
          logger.debug(`${key} set to ${value}`)
        }

        // verbose/debug preExisted key/value
        const preExisted = processedEnv.preExisted
        for (const [key, value] of Object.entries(preExisted)) {
          logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
          logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
        }
      }
    }

    let msg = `injecting env (${uniqueInjectedKeys.length})`
    if (readableFilepaths.length > 0 && readableStrings.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}, and --env flag${readableStrings.length > 1 ? 's' : ''}`
    } else if (readableFilepaths.length > 0) {
      msg += ` from ${readableFilepaths.join(', ')}`
    } else if (readableStrings.length > 0) {
      msg += ` from --env flag${readableStrings.length > 1 ? 's' : ''}`
    }

    logger.successv(msg)
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
  }

  // Extract command and arguments after '--'
  const commandIndex = process.argv.indexOf('--')
  if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
    logger.error('missing command after [dotenvx run --]')
    logger.error('')
    logger.error('  get help: [dotenvx help run]')
    logger.error('  or try:   [dotenvx run -- npm run dev]')
    process.exit(1)
  } else {
    await executeCommand(commandArgs, process.env)
  }
}

module.exports = run
