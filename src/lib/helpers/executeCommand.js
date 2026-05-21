const path = require('path')
const which = require('which')
const execute = require('./../../lib/helpers/execute')
const { logger } = require('./../../shared/logger')
const Errors = require('./errors')

async function executeCommand (commandArgs, env) {
  const FORWARD_SIGNAL_GRACE_MS = 1000
  const FORCE_KILL_GRACE_MS = 1000
  const signals = [
    'SIGHUP', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2'
  ]

  logger.debug(`executing process command [${commandArgs.join(' ')}]`)

  let child
  let signalSent
  let sigintCount = 0
  const signalForwardTimers = new Set()
  const otherSignalHandlers = new Map()
  const isInteractiveTTY = Boolean(process.stdin && process.stdin.isTTY)

  const isChildRunning = () => {
    return child && child.exitCode === null && child.signalCode === null
  }

  const queueSignalForward = (signal) => {
    logger.debug(`queueing ${signal} to command process after ${FORWARD_SIGNAL_GRACE_MS}ms`)
    const timer = setTimeout(() => {
      signalForwardTimers.delete(timer)

      if (!isChildRunning()) {
        logger.debug(`skipping ${signal} forward because command process is already exiting`)
        return
      }

      logger.debug(`sending ${signal} to command process`)
      signalSent = signal
      child.kill(signal)
    }, FORWARD_SIGNAL_GRACE_MS)

    if (typeof timer.unref === 'function') timer.unref()
    signalForwardTimers.add(timer)
  }

  const queueForceKill = () => {
    logger.debug(`queueing SIGKILL to command process after ${FORCE_KILL_GRACE_MS}ms`)
    const timer = setTimeout(() => {
      signalForwardTimers.delete(timer)

      if (!isChildRunning()) {
        logger.debug('skipping SIGKILL because command process is already exiting')
        return
      }

      logger.debug('sending SIGKILL to command process')
      child.kill('SIGKILL')
    }, FORCE_KILL_GRACE_MS)

    if (typeof timer.unref === 'function') timer.unref()
    signalForwardTimers.add(timer)
  }

  /* c8 ignore start */
  const sigintHandler = () => {
    logger.debug('received SIGINT')
    logger.debug('checking command process')
    logger.debug(child)

    if (!child) return

    sigintCount += 1

    if (isInteractiveTTY) {
      if (sigintCount === 1) {
        logger.debug('TTY mode: not forwarding first SIGINT to command process')
        return
      }

      logger.debug('TTY mode: forwarding SIGTERM on second SIGINT to command process')
      signalSent = 'SIGTERM'
      child.kill('SIGTERM')

      if (sigintCount === 2) queueForceKill()
      return
    }

    queueSignalForward('SIGINT')
  }

  const sigtermHandler = () => {
    logger.debug('received SIGTERM')
    logger.debug('checking command process')
    logger.debug(child)

    if (!child) return

    queueSignalForward('SIGTERM')
  }

  const handleOtherSignal = (signal) => {
    logger.debug(`received ${signal}`)
    if (child) child.kill(signal)
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

    child = execute.execa(commandArgs[0], commandArgs.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })

    process.on('SIGINT', sigintHandler)
    process.on('SIGTERM', sigtermHandler)

    signals.forEach(signal => {
      const handler = () => handleOtherSignal(signal)
      otherSignalHandlers.set(signal, handler)
      process.on(signal, handler)
    })

    // Wait for the command process to finish
    const { exitCode } = await child

    if (exitCode !== 0) {
      logger.debug(`received exitCode ${exitCode}`)
      throw new Errors({ exitCode }).commandExitedWithCode()
    }
  } catch (error) {
    // no color on these errors as they can be standard errors for things like jest exiting with exitCode 1 for a single failed test.
    if (!['SIGINT', 'SIGTERM'].includes(signalSent || error.signal)) {
      if (error.code === 'ENOENT') {
        logger.error(`Unknown command: ${error.command}`)
      } else {
        logger.error(error.message)
      }
    }

    // Exit with the error code from the command process, or 1 if unavailable
    process.exit(error.exitCode || 1)
  } finally {
    signalForwardTimers.forEach(timer => clearTimeout(timer))
    signalForwardTimers.clear()

    // Clean up: Remove the SIGINT handler
    process.removeListener('SIGINT', sigintHandler)
    // Clean up: Remove the SIGTERM handler
    process.removeListener('SIGTERM', sigtermHandler)

    otherSignalHandlers.forEach((handler, signal) => {
      process.removeListener(signal, handler)
    })
  }
}

module.exports = executeCommand
