const t = require('tap')
const sinon = require('sinon')

const store = require('../../../src/shared/store')
const Settings = require('../../../src/lib/services/settings')

const originalStore = store.confStore.store
const originalPath = store.confStore.path

t.beforeEach((ct) => {
  store.confStore.path = '/tmp/.env'
  const mocked = {
    DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    GH_USERNAME_DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  }

  store.confStore.store = mocked

  // do not delete. necessary to not write to user's real dotenvx settings .env file if running tests
  sinon.stub(store.confStore, 'set').callsFake((key, value) => {
    // protects from setting actually path/to/conf/settings/.env
  })
})

t.afterEach((ct) => {
  store.confStore.path = originalPath
  store.confStore.store = originalStore
})

t.test('#run', ct => {
  const json = new Settings().run()

  ct.same(json.DOTENVX_SETTINGS_PATH, '/tmp/.env')
  ct.same(json.DOTENVX_TOKEN, 'dxo_1234')
  ct.same(json.DOTENVX_HOSTNAME, 'https://mocked.dotenvx.com')

  ct.end()
})
