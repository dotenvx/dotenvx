const { execFileSync } = require('child_process')
const nativeStoreError = require('./nativeStoreError')

const SECURITY_BIN = '/usr/bin/security'
const SERVICE = 'dotenvx'

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
      execFileSync(SECURITY_BIN, ['add-generic-password', '-U', '-s', SERVICE, '-a', key, '-l', label, '-w', value], { timeout: 10000, killSignal: 'SIGKILL', stdio: 'ignore' })
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
