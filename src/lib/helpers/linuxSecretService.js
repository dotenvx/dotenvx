const { execFileSync } = require('child_process')
const nativeStoreError = require('./nativeStoreError')

const SECRET_TOOL_BIN = 'secret-tool'
const SERVICE = 'dotenvx'

function attributes (publicKey) {
  return ['service', SERVICE, 'public-key', publicKey]
}

function get (publicKey) {
  try {
    return execFileSync(SECRET_TOOL_BIN, ['lookup', ...attributes(publicKey)], {
      timeout: 10000,
      killSignal: 'SIGKILL',
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim() || null
  } catch (error) {
    throw nativeStoreError('failed to read private key from Linux Secret Service', error, true)
  }
}

function set (publicKey, privateKey, label) {
  try {
    execFileSync(SECRET_TOOL_BIN, ['store', `--label=${label}`, ...attributes(publicKey)], {
      input: privateKey,
      timeout: 10000,
      killSignal: 'SIGKILL',
      encoding: 'utf8',
      stdio: ['pipe', 'ignore', 'pipe']
    })
  } catch (error) {
    throw nativeStoreError('failed to save private key to Linux Secret Service', error, true)
  }
}

module.exports = {
  get,
  set,
  delete (publicKey) {
    try {
      execFileSync(SECRET_TOOL_BIN, ['clear', ...attributes(publicKey)], {
        timeout: 10000,
        killSignal: 'SIGKILL',
        stdio: ['ignore', 'ignore', 'pipe']
      })
    } catch (error) {
      throw nativeStoreError('failed to delete private key from Linux Secret Service', error, true)
    }
  }
}
