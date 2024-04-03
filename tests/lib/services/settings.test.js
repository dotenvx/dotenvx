const t = require('tap')

const store = require('../../../src/shared/store')
const Settings = require('../../../src/lib/services/settings')

const originalStore = store.confStore.store
const originalPath = store.confStore.path

t.beforeEach((ct) => {
  const mocked = {
    DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    GH_USERNAME_DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  }

  store.confStore.store = mocked
  store.confStore.path = '/tmp/.env'
})

t.afterEach((ct) => {
  store.confStore.store = originalStore
  store.confStore.path = originalPath
})

t.test('#run', ct => {
  const json = new Settings().run()

  ct.same(json.DOTENVX_SETTINGS_PATH, '/tmp/.env')
  ct.same(json.DOTENVX_TOKEN, 'dxo_1234')
  ct.same(json.DOTENVX_HOSTNAME, 'https://mocked.dotenvx.com')

  ct.end()
})
