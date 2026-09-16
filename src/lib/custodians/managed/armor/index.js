const Session = require('../../../../db/session')
const get = require('./get')
const store = require('./store')

module.exports = {
  id: 'armored',
  name: '⛨ Armor',
  custody: 'managed',
  enabled: (options = {}) => options.noArmor !== true && options.armor !== false,
  available: () => true,
  async configured (options = {}) {
    return !!options.token || !await new Session().noArmor()
  },
  configuredSync (options = {}) {
    return !!options.token || !new Session().noArmorSync()
  },
  get,
  getSync (publicKey) {
    const { createSyncFn } = require('@dotenvx/tooling')
    const runProviderSync = createSyncFn(require.resolve('../../../providers/provider-worker.js'))
    return runProviderSync(publicKey)
  },
  store
}
