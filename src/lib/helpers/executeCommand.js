const path = require('path')
const which = require('which')
const execute = require('./../../lib/helpers/execute')
const { logger } = require('./../../shared/logger')

async function executeCommand (commandArgs, env) {
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
    /* c8 ignore start */
    } else {
      logger.debug('no command process to send SIGINT to')
    }
    /* c8 ignore stop */
  }
  // handler for SIGTERM

  /* c8 ignore start */
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
  /* c8 ignore stop */

  try {
    // ensure the first command is expanded
    try {
      commandArgs[0] = path.resolve(which.sync(`${commandArgs[0]}`))
      logger.debug(`expanding process command to [${commandArgs.join(' ')}]`)
    } catch (e) {
      logger.debug(`could not expand process command. using [${commandArgs.join(' ')}]`)
    }

    // expand any other commands that follow a --
    let expandNext = false
    for (let i = 0; i < commandArgs.length; i++) {
      if (commandArgs[i] === '--') {
        expandNext = true
      } else if (expandNext) {
        try {
          commandArgs[i] = path.resolve(which.sync(`${commandArgs[i]}`))
          logger.debug(`expanding process command to [${commandArgs.join(' ')}]`)
        } catch (e) {
          logger.debug(`could not expand process command. using [${commandArgs.join(' ')}]`)
        }
        expandNext = false
      }
    }

    commandProcess = execute.execa(commandArgs[0], commandArgs.slice(1), {
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

module.exports = executeCommand
