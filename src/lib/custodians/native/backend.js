const macosKeychain = require('../../helpers/macosKeychain')
const windowsCredentialManager = require('../../helpers/windowsCredentialManager')
const linuxSecretService = require('../../helpers/linuxSecretService')

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
  if (!['darwin', 'linux', 'win32'].includes(process.platform)) return {}

  try {
    const privateKeyHex = get(publicKeyHex)

    if (!privateKeyHex) return {}

    return { [publicKeyHex]: privateKeyHex }
  } catch {
    return {}
  }
}

index.set = set
index.get = get

module.exports = index
