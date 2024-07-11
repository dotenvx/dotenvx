const t = require('tap')
const sinon = require('sinon')
const capcon = require('capture-console')

const main = require('../../../../src/lib/main')
const settings = require('../../../../src/cli/actions/ext/settings')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('settings calls main.settings', ct => {
  const stub = sinon.stub(main, 'settings')
  stub.returns({
    DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    GH_USERNAME_DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  })

  const stdout = capcon.interceptStdout(() => {
    settings.call(fakeContext)
  })

  ct.ok(stub.called, 'main.settings() called')
  ct.equal(stdout, '{"DOTENVX_TOKEN":"dxo_1234","DOTENVX_HOSTNAME":"https://mocked.dotenvx.com","GH_USERNAME_DOTENVX_TOKEN":"dxo_1234","DOTENVX_LATEST_VERSION":"X.X.X"}')

  ct.end()
})

t.test('settings with KEY calls main.settings', ct => {
  const stub = sinon.stub(main, 'settings')
  stub.returns('dxo_1234')

  const stdout = capcon.interceptStdout(() => {
    settings.call(fakeContext, 'DOTENVX_TOKEN')
  })

  ct.ok(stub.called, 'main.settings() called')
  ct.equal(stdout, 'dxo_1234')

  ct.end()
})

t.test('settings with --pretty-print calls main.settings', ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(main, 'settings')
  stub.returns({
    DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_HOSTNAME: 'https://mocked.dotenvx.com',
    GH_USERNAME_DOTENVX_TOKEN: 'dxo_1234',
    DOTENVX_LATEST_VERSION: 'X.X.X'
  })

  const stdout = capcon.interceptStdout(() => {
    settings.call(fakeContext)
  })

  ct.ok(stub.called, 'main.settings() called')
  ct.equal(stdout, `{
  "DOTENVX_TOKEN": "dxo_1234",
  "DOTENVX_HOSTNAME": "https://mocked.dotenvx.com",
  "GH_USERNAME_DOTENVX_TOKEN": "dxo_1234",
  "DOTENVX_LATEST_VERSION": "X.X.X"
}`)

  ct.end()
})
