const backend = require('./backend')
const storePrivateKey = require('./store')

const names = {
  darwin: 'macOS Keychain',
  win32: 'Windows Credential Manager',
  linux: 'Linux Secret Service'
}

function enabled (options = {}) {
  return !!names[process.platform] && !process.env.CI && options.noNative !== true && options.native !== false && process.env.DOTENVX_NO_NATIVE !== 'true'
}

module.exports = {
  id: 'native',
  get name () { return `OS${names[process.platform] ? ` (${names[process.platform]})` : ''}` },
  enabled,
  available: () => true,
  configured: () => true,
  get: backend,
  getSync: backend,
  set: backend.set,
  delete: backend.delete,
  store (publicKey, privateKey, context) {
    if (!storePrivateKey(publicKey, privateKey, context.keysFilepath)) return { fallback: 'file' }
    return { nativePrivateKeyAdded: true }
  }
}
