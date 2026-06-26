const Session = require('./../../db/session')

const armorProvider = require('./armor/index')
function syncArmorProvider (publicKeyHex) {
  const { createSyncFn } = require('synckit')
  const runProviderSync = createSyncFn(require.resolve('./worker.js'))
  return runProviderSync(require.resolve('./armor/index'), publicKeyHex)
}

async function providers (options = {}) {
  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && await sesh.noArmor())
  if (noArmor) return null

  return (publicKeyHex) => armorProvider(publicKeyHex, {
    onStatus: options.onStatus,
    token: options.token,
    command: options.command
  })
}

providers.sync = function providersSync (options = {}) {
  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && sesh.noArmorSync())
  if (noArmor) return null

  return syncArmorProvider
}

module.exports = providers
