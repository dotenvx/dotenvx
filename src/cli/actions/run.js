const path = require('path')
const execa = require('execa')
const which = require('which')
const logger = require('./../../shared/logger')

const RunDefault = require('./../../lib/services/runDefault')
const RunVault = require('./../../lib/services/runVault')

const REPORT_ISSUE_LINK = 'https://github.com/dotenvx/dotenvx/issues/new'

const executeCommand = async function (commandArgs, env) {
  const signals = [
    'SIGHUP', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
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

    // commandProcess = execa(commandArgs[0], commandArgs.slice(1), {
    commandProcess = execa(systemCommandPath, commandArgs.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })

    process.on('SIGINT', sigintHandler)

    signals.forEach(signal => {
      process.on(signal, () => handleOtherSignal(signal))
    })

    // Wait for the command process to finish
    const { exitCode } = await commandProcess

    if (exitCode !== 0) {
      logger.debug(`received exitCode ${exitCode}`)
      throw new Error(`Command failed with exit code ${exitCode}`)
    }
  } catch (error) {
    if (error.signal !== 'SIGINT') {
      logger.error(error.message)
      logger.error(`command [${commandArgs.join(' ')}] failed`)
      logger.error('')
      logger.error(`  try without dotenvx: [${commandArgs.join(' ')}]`)
      logger.error('')
      logger.error('if that succeeds, then dotenvx is the culprit. report issue:')
      logger.error(`<${REPORT_ISSUE_LINK}>`)
    }

    // Exit with the error code from the command process, or 1 if unavailable
    process.exit(error.exitCode || 1)
  } finally {
    // Clean up: Remove the SIGINT handler
    process.removeListener('SIGINT', sigintHandler)
  }
}

async function run () {
  const commandArgs = this.args
  logger.debug(`process command [${commandArgs.join(' ')}]`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // load from .env.vault file
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    try {
      const {
        envVaultFile,
        parsed,
        injected,
        preExisted,
        uniqueInjectedKeys
      } = new RunVault(options.envVaultFile, options.env, process.env.DOTENV_KEY, options.overload).run()

      logger.verbose(`loading env from encrypted ${envVaultFile} (${path.resolve(envVaultFile)})`)
      logger.debug(`decrypting encrypted env from ${envVaultFile} (${path.resolve(envVaultFile)})`)

      // debug parsed
      logger.debug(parsed)

      // verbose/debug injected key/value
      for (const [key, value] of Object.entries(injected)) {
        logger.verbose(`${key} set`)
        logger.debug(`${key} set to ${value}`)
      }

      // verbose/debug preExisted key/value
      for (const [key, value] of Object.entries(preExisted)) {
        logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
        logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
      }

      logger.successv(`injecting env (${uniqueInjectedKeys.length}) from encrypted ${envVaultFile}`)
    } catch (error) {
      logger.error(error.message)
      if (error.help) {
        logger.help(error.help)
      }
    }
  } else {
    const {
      files,
      readableFilepaths,
      uniqueInjectedKeys
    } = new RunDefault(options.envFile, options.env, options.overload).run()

    for (const file of files) {
      const filepath = file.filepath

      logger.verbose(`loading env from ${filepath} (${path.resolve(filepath)})`)

      if (file.error) {
        if (file.error.code === 'MISSING_ENV_FILE') {
          logger.warnv(file.error)
          logger.help(`? in development: add one with [echo "HELLO=World" > ${filepath}] and re-run [dotenvx run -- ${commandArgs.join(' ')}]`)
          logger.help('? for production: set [DOTENV_KEY] on your server and re-deploy')
          logger.help('? for ci: set [DOTENV_KEY] on your ci and re-build')
        } else {
          logger.warnv(file.error)
        }
      } else {
        // debug parsed
        const parsed = file.parsed
        logger.debug(parsed)

        // verbose/debug injected key/value
        const injected = file.injected
        for (const [key, value] of Object.entries(injected)) {
          logger.verbose(`${key} set`)
          logger.debug(`${key} set to ${value}`)
        }

        // verbose/debug preExisted key/value
        const preExisted = file.preExisted
        for (const [key, value] of Object.entries(preExisted)) {
          logger.verbose(`${key} pre-exists (protip: use --overload to override)`)
          logger.debug(`${key} pre-exists as ${value} (protip: use --overload to override)`)
        }
      }
    }

    let msg = `injecting env (${uniqueInjectedKeys.length})`
    if (readableFilepaths.length > 0) {
      msg += ` from ${readableFilepaths}`
    }
    logger.successv(msg)
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
