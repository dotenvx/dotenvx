const { execFileSync, spawnSync } = require('child_process')
const nativeStoreError = require('./nativeStoreError')

const SECURITY_BIN = '/usr/bin/security'
const SERVICE = 'dotenvx'

function quoteArgument (value) {
  if (typeof value !== 'string' || /[\r\n\0]/.test(value)) throw new Error('invalid Keychain argument')
  return '"' + value.replace(/[\\"]/g, '\\$&') + '"'
}

module.exports = {
  get (key) {
    try {
      return execFileSync(SECURITY_BIN, ['find-generic-password', '-s', SERVICE, '-a', key, '-w'], {
        timeout: 10000,
        killSignal: 'SIGKILL',
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      }).trim()
    } catch (error) {
      throw nativeStoreError('failed to read private key from macOS Keychain', error)
    }
  },

  set (key, value, label) {
    try {
      const input = ['add-generic-password', '-U', '-s', SERVICE, '-a', key, '-l', label, '-w', value].map(quoteArgument).join(' ') + '\n'
      // security's 4096-byte line buffer must also consume the newline and NUL.
      if (Buffer.byteLength(input, 'utf8') >= 4096) throw new Error('Keychain command too long')
      // Interactive security can exit zero on failure, so inspect stderr too.
      const result = spawnSync(SECURITY_BIN, ['-i'], {
        input,
        timeout: 10000,
        killSignal: 'SIGKILL',
        stdio: ['pipe', 'ignore', 'pipe']
      })
      if (result.error) throw result.error
      if (result.status !== 0 || result.signal || result.stderr.length > 0) throw new Error('Keychain write failed')
    } catch (error) {
      throw nativeStoreError('failed to save private key to macOS Keychain', error)
    }
  },

  delete (key) {
    try {
      execFileSync(SECURITY_BIN, ['delete-generic-password', '-s', SERVICE, '-a', key], { timeout: 10000, killSignal: 'SIGKILL', stdio: 'ignore' })
    } catch (error) {
      throw nativeStoreError('failed to delete private key from macOS Keychain', error)
    }
  }
}
