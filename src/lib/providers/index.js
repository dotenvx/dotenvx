const Session = require('./../../db/session')

const armorProvider = require('./armor/index')
function syncArmorProvider (publicKeyHex) {
  const { createSyncFn } = require('synckit')
  const runProviderSync = createSyncFn(require.resolve('./worker.js'))
  return runProviderSync(require.resolve('./armor/index'), publicKeyHex)
}

async function providers (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) {
    return options.provider
  }

  if (options.noArmor || options.armor === false) {
    return null
  }

  const sesh = new Session()
  const noArmor = !options.token && await sesh.noArmor()
  if (noArmor) return null

  return (publicKeyHex) => armorProvider(publicKeyHex, {
    onStatus: options.onStatus,
    token: options.token,
    command: options.command
  })
}

providers.sync = function providersSync (options = {}) {
  if (Object.prototype.hasOwnProperty.call(options, 'provider')) {
    return options.provider
  }

  if (options.noArmor || options.armor === false) {
    return null
  }

  const sesh = new Session()
  const noArmor = !options.token && sesh.noArmorSync()
  if (noArmor) return null

  return syncArmorProvider
}

module.exports = providers
