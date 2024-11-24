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

  if (commandArgs.length < 1) {
    const hasSeparator = process.argv.indexOf('--') !== -1

    if (hasSeparator) {
      console.error('missing command after [dotenvx run --]. try [dotenvx run -- yourcommand]')
    } else {
      const realExample = options.envFile[0] || '.env'
      console.error(`ambiguous command due to missing '--' separator. try [dotenvx run -f ${realExample} -- yourcommand]`)
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

      if (processedEnv.errors) {
        for (const error of processedEnv.errors) {
          if (error.code === 'MISSING_ENV_FILE') {
            if (!options.convention) { // do not output error for conventions (too noisy)
              console.error(error.message)
              if (error.help) {
                logger.help(`${error.help} and re-run [dotenvx run -- ${commandArgs.join(' ')}]`)
              }
            }
          } else {
            console.error(error.message)
            if (error.help) {
              logger.help(error.help)
            }
          }
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
    console.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    process.exit(1)
  }

  await executeCommand(commandArgs, process.env)
}

module.exports = run
