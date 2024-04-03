const t = require('tap')
const sinon = require('sinon')

const store = require('../../src/shared/store')
const packageJson = require('../../src/lib/helpers/packageJson')

const originalStore = store.confStore.store

// Stub the get method before the tests
t.beforeEach((ct) => {
  const mocked = {
    DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    GH_USERNAME_DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  }

  store.confStore.store = mocked

  sinon.stub(store.confStore, 'set').callsFake((key, value) => {
    // protects from setting actually path/to/conf/settings/.env
  })
})

// Restore the original method after the tests
t.afterEach((ct) => {
  store.confStore.set.restore()
  store.confStore.store = originalStore
})

t.test('store.getHostname', (ct) => {
  const result = store.getHostname()

  ct.equal(result, 'https://mocked.dotenvx.com')

  ct.end()
})

t.test('store.getHostname when not set in settings', (ct) => {
  const mocked = {}

  store.confStore.store = mocked

  const result = store.getHostname()

  ct.equal(result, 'https://hub.dotenvx.com')

  ct.end()
})

t.test('store.getToken', (ct) => {
  const result = store.getToken()

  ct.equal(result, 'dxo_1234')

  ct.end()
})

t.test('store.getUsername', (ct) => {
  const result = store.getUsername()

  ct.equal(result, 'username')

  ct.end()
})

t.test('store.getUsername when none yet set', (ct) => {
  const mocked = {
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  }
  store.confStore.store = mocked

  const result = store.getUsername()

  ct.equal(result, null)

  ct.end()
})

t.test('store.getLatestVersion', (ct) => {
  const result = store.getLatestVersion()

  ct.equal(result, 'X.X.X')

  ct.end()
})

t.test('store.getLatestVersion when none yet set', (ct) => {
  store.confStore.store = {}

  const result = store.getLatestVersion()

  ct.equal(result, packageJson.version)

  ct.end()
})

t.test('store.getLatestVersionLastChecked', (ct) => {
  const result = store.getLatestVersionLastChecked()

  ct.equal(result, 0)

  ct.end()
})

t.test('store.setHostname', (ct) => {
  const result = store.setHostname('http://localhost:3000')

  ct.equal(result, 'http://localhost:3000')

  ct.end()
})

t.test('store.setToken', (ct) => {
  const result = store.setToken('gh/motdotla', 'dxo_9876')

  ct.equal(result, 'dxo_9876')

  ct.end()
})

t.test('store.setLatestVersion', (ct) => {
  const result = store.setLatestVersion('Y.Y.Y')

  ct.equal(result, 'Y.Y.Y')

  ct.end()
})

t.test('store.setLatestVersionLastChecked', (ct) => {
  const result = store.setLatestVersionLastChecked(1234)

  ct.equal(result, 1234)

  ct.end()
})

t.test('store.configPath', (ct) => {
  const originalPath = store.confStore.path
  store.confStore.path = '/tmp/.env'

  const result = store.configPath()

  ct.equal(result, '/tmp/.env')

  store.confStore.path = originalPath

  ct.end()
})
