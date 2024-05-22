const path = require('path')
const execa = require('execa')
const which = require('which')
const { logger } = require('./../../shared/logger')

const Run = require('./../../lib/services/run')

const conventions = require('./../../lib/helpers/conventions')

const executeCommand = async function (commandArgs, env) {
  const signals = [
    'SIGHUP', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2'
  ]

  logger.debug(`executing process command [${commandArgs.join(' ')}]`)

  // handler for SIGINT
  let commandProcess
  const sigintHandler = () => {
    logger.debug('received SIGINT')
    logger.debug('checking command process')
    logger.debug(commandProcess)

    if (commandProcess) {
      logger.debug('sending SIGINT to command process')
      commandProcess.kill('SIGINT') // Send SIGINT to the command process
    } else {
      logger.debug('no command process to send SIGINT to')
    }
  }
  // handler for SIGTERM
  const sigtermHandler = () => {
    logger.debug('received SIGTERM')
    logger.debug('checking command process')
    logger.debug(commandProcess)

    if (commandProcess) {
      logger.debug('sending SIGTERM to command process')
      commandProcess.kill('SIGTERM') // Send SIGTEM to the command process
    } else {
      logger.debug('no command process to send SIGTERM to')
    }
  }

  const handleOtherSignal = (signal) => {
    logger.debug(`received ${signal}`)
  }

  try {
    let systemCommandPath = commandArgs[0]
    try {
      systemCommandPath = which.sync(`${commandArgs[0]}`)
      logger.debug(`expanding process command to [${systemCommandPath} ${commandArgs.slice(1).join(' ')}]`)
    } catch (e) {
      logger.debug(`could not expand process command. using [${systemCommandPath} ${commandArgs.slice(1).join(' ')}]`)
    }

    commandProcess = execa(systemCommandPath, commandArgs.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })

    process.on('SIGINT', sigintHandler)
    process.on('SIGTERM', sigtermHandler)

    signals.forEach(signal => {
      process.on(signal, () => handleOtherSignal(signal))
    })

    // Wait for the command process to finish
    const { exitCode } = await commandProcess

    if (exitCode !== 0) {
      logger.debug(`received exitCode ${exitCode}`)
      throw new Error(`Command exited with exit code ${exitCode}`)
    }
  } catch (error) {
    // no color on these errors as they can be standard errors for things like jest exiting with exitCode 1 for a single failed test.
    if (error.signal !== 'SIGINT' && error.signal !== 'SIGTERM') {
      if (error.code === 'ENOENT') {
        logger.errornocolor(`Unknown command: ${error.command}`)
      } else if (error.message.includes('Command failed with exit code 1')) {
        logger.errornocolor(`Command exited with exit code 1: ${error.command}`)
      } else {
        logger.errornocolor(error.message)
      }
    }

    // Exit with the error code from the command process, or 1 if unavailable
    process.exit(error.exitCode || 1)
  } finally {
    // Clean up: Remove the SIGINT handler
    process.removeListener('SIGINT', sigintHandler)
    // Clean up: Remove the SIGTERM handler
    process.removeListener('SIGTERM', sigtermHandler)
  }
}

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
      logger.warn('DEPRECATION NOTICE: Run [dotenvx vault convert] for instructions on converting your .env.vault file to encrypted .env files (using public key encryption algorithm secp256k1)')
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
            logger.warnv(processedEnv.error)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.filepath}] and re-run [dotenvx run -- ${commandArgs.join(' ')}]`)
          }
        } else {
          logger.warnv(processedEnv.error)
        }
      } else {
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
    // const commandArgs = process.argv.slice(commandIndex + 1)
    await executeCommand(commandArgs, process.env)
  }
}

module.exports = run
