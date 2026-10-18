const { execFile, execFileSync } = require('child_process')
const { randomUUID } = require('crypto')
const Errors = require('./errors')
const createElapsedStatus = require('./createElapsedStatus')

function execFileAsync (command, args, options, input) {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr
        return reject(error)
      }
      resolve(stdout)
    })
    if (input !== undefined && child.stdin) {
      child.stdin.on('error', () => {})
      child.stdin.end(input)
    }
  })
}

function isSecretReference (value) {
  return typeof value === 'string' && value.startsWith('op://')
}

function resolutionError (key, error) {
  const message = missingCli(error)
    ? `1Password CLI is not installed and could not resolve ${key}`
    : `1Password CLI failed to resolve ${key}`

  return new Errors({ message }).onePasswordFailed()
}

function missingCli (error) {
  return error && (error.code === 'ENOENT' ||
    ((error.code === 127 || error.status === 127) && /op: (not found|command not found)/i.test(String(error.stderr || ''))))
}

function batchRequest (entries) {
  const separator = `\nDOTENVX_${randomUUID()}\n`
  return {
    separator,
    input: entries.map(([, reference]) => `{{ ${reference} }}`).join(separator)
  }
}

function batchCommand () {
  // On Unix Node uses a socket for stdin, but op inject requires a real pipe.
  // The shell text is constant; references are sent only through stdin.
  return process.platform === 'win32'
    ? ['op', ['inject']]
    : ['/bin/sh', ['-c', 'cat | op "$@"', 'dotenvx-op', 'inject']]
}

function batchValues (stdout, separator, count) {
  const values = stdout.split(separator)
  if (values.length !== count) throw new Error('Invalid 1Password batch response')
  return values
}

function canRecover (error) {
  // Do not multiply requests when authentication, quota or transport has failed.
  return error && !missingCli(error) &&
    /not found|could not find|isn't an item|is not an item|isn't a field|is not a field|not a valid secret reference|invalid secret reference|no such field|does not have a field/i.test(String(error.stderr || '')) &&
    !/429|rate.?limit|too many requests|quota/i.test(String(error.stderr || ''))
}

async function resolveOnePassword (parsed, options = {}) {
  const errors = []
  const unresolved = []
  const hasSecretReferences = Object.values(parsed).some(isSecretReference)
  const stopStatus = hasSecretReferences
    ? createElapsedStatus(options.onStatus, 'awaiting 1password')
    : null

  try {
    const entries = Object.entries(parsed).filter(([, value]) => isSecretReference(value))
    if (entries.length > 1 && entries.every(([, value]) => !/[{}\r\n]/.test(value))) {
      const { input, separator } = batchRequest(entries)
      try {
        const [command, args] = batchCommand()
        const stdout = await execFileAsync(command, args, { encoding: 'utf8', windowsHide: true }, input)
        const values = batchValues(stdout, separator, entries.length)
        entries.forEach(([key], index) => { parsed[key] = values[index] })
        return { errors, unresolved }
      } catch (error) {
        if (!canRecover(error)) {
          for (const [key] of entries) {
            errors.push(resolutionError(key, error))
            unresolved.push(key)
          }
          return { errors, unresolved }
        }
      }
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (!isSecretReference(value)) continue

      try {
        const stdout = await execFileAsync('op', ['read', value, '--no-newline'], {
          encoding: 'utf8',
          windowsHide: true
        })
        parsed[key] = stdout
      } catch (error) {
        errors.push(resolutionError(key, error))
        unresolved.push(key)
      }
    }
  } finally {
    if (stopStatus) {
      stopStatus()
      if (options.onStatus) options.onStatus('injecting')
    }
  }

  return { errors, unresolved }
}

function resolveOnePasswordSync (parsed) {
  const errors = []
  const unresolved = []

  const entries = Object.entries(parsed).filter(([, value]) => isSecretReference(value))
  if (entries.length > 1 && entries.every(([, value]) => !/[{}\r\n]/.test(value))) {
    const { input, separator } = batchRequest(entries)
    try {
      const [command, args] = batchCommand()
      const stdout = execFileSync(command, args, {
        encoding: 'utf8', windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], input
      })
      const values = batchValues(stdout, separator, entries.length)
      entries.forEach(([key], index) => { parsed[key] = values[index] })
      return { errors, unresolved }
    } catch (error) {
      if (!canRecover(error)) {
        for (const [key] of entries) {
          errors.push(resolutionError(key, error))
          unresolved.push(key)
        }
        return { errors, unresolved }
      }
    }
  }

  for (const [key, value] of Object.entries(parsed)) {
    if (!isSecretReference(value)) continue

    try {
      parsed[key] = execFileSync('op', ['read', value, '--no-newline'], {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      })
    } catch (error) {
      errors.push(resolutionError(key, error))
      unresolved.push(key)
    }
  }

  return { errors, unresolved }
}

module.exports = resolveOnePassword
module.exports.sync = resolveOnePasswordSync
