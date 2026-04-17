const path = require('path')
const which = require('which')
const execute = require('./../../lib/helpers/execute')
const Ops = require('./../extensions/ops')
const { logger } = require('./../../shared/logger')
const Errors = require('./errors')

function createOpsRedactionForwarder (source, destination, ops, redactionSecretValues) {
  const maxSecretLength = redactionSecretValues.reduce((max, value) => {
    return Math.max(max, value.length)
  }, 0)

  const tailLength = Math.max(0, maxSecretLength - 1)
  let pending = ''

  return new Promise((resolve, reject) => {
    source.on('data', (chunk) => {
      pending += chunk.toString()

      if (tailLength === 0) {
        destination.write(ops.redactSync(pending, redactionSecretValues))
        pending = ''
        return
      }

      if (pending.length <= tailLength) return

      const splitAt = pending.length - tailLength
      const safeChunk = pending.slice(0, splitAt)
      pending = pending.slice(splitAt)

      destination.write(ops.redactSync(safeChunk, redactionSecretValues))
    })

    source.on('end', () => {
      if (pending.length > 0) {
        destination.write(ops.redactSync(pending, redactionSecretValues))
      }
      resolve()
    })

    source.on('error', reject)
  })
}

async function executeCommand (commandArgs, env, options = {}) {
  const signals = [
    'SIGHUP', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2'
  ]

  logger.debug(`executing process command [${commandArgs.join(' ')}]`)

  let child
  let signalSent

  /* c8 ignore start */
  const sigintHandler = () => {
    logger.debug('received SIGINT')
    logger.debug('checking command process')
    logger.debug(child)

    if (child) {
      logger.debug('sending SIGINT to command process')
      signalSent = 'SIGINT'
      child.kill('SIGINT') // Send SIGINT to the command process
    } else {
      logger.debug('no command process to send SIGINT to')
    }
  }

  const sigtermHandler = () => {
    logger.debug('received SIGTERM')
    logger.debug('checking command process')
    logger.debug(child)

    if (child) {
      logger.debug('sending SIGTERM to command process')
      signalSent = 'SIGTERM'
      child.kill('SIGTERM') // Send SIGTERM to the command process
    } else {
      logger.debug('no command process to send SIGTERM to')
    }
  }

  const handleOtherSignal = (signal) => {
    logger.debug(`received ${signal}`)
    child.kill(signal)
  }
  /* c8 ignore stop */

  const redactionSecretValues = Array.isArray(options.redactionSecretValues) ? options.redactionSecretValues : []
  const useOpsRedaction = options.useOpsRedaction === true && redactionSecretValues.length > 0

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

    if (useOpsRedaction) {
      logger.debug(`ops redaction enabled for ${redactionSecretValues.length} injected value(s)`)

      child = execute.execa(commandArgs[0], commandArgs.slice(1), {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, ...env }
      })

      const ops = new Ops()
      const stdoutForwarder = createOpsRedactionForwarder(child.stdout, process.stdout, ops, redactionSecretValues)
      const stderrForwarder = createOpsRedactionForwarder(child.stderr, process.stderr, ops, redactionSecretValues)

      process.on('SIGINT', sigintHandler)
      process.on('SIGTERM', sigtermHandler)

      signals.forEach(signal => {
        process.on(signal, () => handleOtherSignal(signal))
      })

      const [{ exitCode }] = await Promise.all([
        child,
        stdoutForwarder,
        stderrForwarder
      ])

      if (exitCode !== 0) {
        logger.debug(`received exitCode ${exitCode}`)
        throw new Errors({ exitCode }).commandExitedWithCode()
      }

      return
    }

    child = execute.execa(commandArgs[0], commandArgs.slice(1), {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    })

    process.on('SIGINT', sigintHandler)
    process.on('SIGTERM', sigtermHandler)

    signals.forEach(signal => {
      process.on(signal, () => handleOtherSignal(signal))
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
    // Clean up: Remove the SIGINT handler
    process.removeListener('SIGINT', sigintHandler)
    // Clean up: Remove the SIGTERM handler
    process.removeListener('SIGTERM', sigtermHandler)
  }
}

module.exports = executeCommand
