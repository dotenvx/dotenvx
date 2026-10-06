const macosKeychain = require('../../../helpers/macosKeychain')
const windowsCredentialManager = require('../../../helpers/windowsCredentialManager')
const linuxSecretService = require('../../../helpers/linuxSecretService')

function get (key) {
  if (process.platform === 'win32') {
    return windowsCredentialManager.get(key)
  }

  if (process.platform === 'linux') {
    return linuxSecretService.get(key)
  }

  return macosKeychain.get(key)
}

function set (key, value, label = key) {
  if (process.platform === 'win32') {
    windowsCredentialManager.set(key, value, label)
    return
  }

  if (process.platform === 'linux') {
    linuxSecretService.set(key, value, label)
    return
  }

  macosKeychain.set(key, value, label)
}

index.delete = function (key) {
  if (process.platform === 'win32') {
    windowsCredentialManager.delete(key)
    return
  }

  if (process.platform === 'linux') {
    linuxSecretService.delete(key)
    return
  }

  macosKeychain.delete(key)
}

function index (publicKeyHex) {
  return require('@dotenvx/providers').native().getSync(publicKeyHex)
}

index.async = function (publicKeyHex) {
  return require('@dotenvx/providers').native().get(publicKeyHex)
}

index.set = set
index.get = get

module.exports = index
