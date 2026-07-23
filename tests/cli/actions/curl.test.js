const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
  process.exitCode = undefined
})

t.afterEach(() => {
  sinon.restore()
  process.exitCode = undefined
})

function loadAction ({ response = { statusCode: 200, body: { text: async () => '{"keypairs":[]}' } } } = {}) {
  const http = sinon.stub().resolves(response)
  const session = {
    token: sinon.stub().returns('token-123'),
    hostname: sinon.stub().returns('https://armor.dotenvx.com'),
    devicePublicKey: sinon.stub().returns('device-public-key')
  }
  const action = proxyquire('../../../src/cli/actions/curl', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/helpers/http': { http }
  })

  return { action, http, session }
}

t.test('makes an authenticated GET request and pretty prints JSON', async ct => {
  const { action, http } = loadAction()
  const log = sinon.stub(console, 'log')

  await action.call({
    args: ['https://armor.dotenvx.com/api/armor/keypairs'],
    opts: () => ({})
  })

  ct.same(http.firstCall.args, [
    'https://armor.dotenvx.com/api/armor/keypairs',
    {
      method: 'GET',
      headers: {
        Authorization: 'Bearer token-123',
        Accept: 'application/json',
        'dotenvx-device-public-key': 'device-public-key'
      },
      body: undefined
    }
  ])
  ct.equal(log.firstCall.args[0], '{\n  "keypairs": []\n}')
})

t.test('defaults to POST when JSON data is supplied', async ct => {
  const { action, http } = loadAction()
  sinon.stub(console, 'log')

  await action.call({
    args: ['https://armor.dotenvx.com/api/armor/keypairs/public-key/settings/guard'],
    opts: () => ({ data: '{ "value": true }' })
  })

  ct.same(http.firstCall.args[1], {
    method: 'POST',
    headers: {
      Authorization: 'Bearer token-123',
      Accept: 'application/json',
      'dotenvx-device-public-key': 'device-public-key',
      'Content-Type': 'application/json'
    },
    body: '{"value":true}'
  })
})

t.test('supports an explicit request method and token', async ct => {
  const { action, http, session } = loadAction()
  sinon.stub(console, 'log')

  await action.call({
    args: ['https://armor.dotenvx.com/api/armor/keypairs'],
    opts: () => ({ request: 'delete', token: 'explicit-token' })
  })

  ct.equal(http.firstCall.args[1].method, 'DELETE')
  ct.equal(http.firstCall.args[1].headers.Authorization, 'Bearer explicit-token')
  ct.equal(session.token.callCount, 0)
})

t.test('refuses to send the token to another origin', async ct => {
  const { action, http } = loadAction()
  const exit = sinon.stub(process, 'exit')

  await action.call({
    args: ['https://evil.example/api/armor/keypairs'],
    opts: () => ({})
  })

  ct.equal(http.callCount, 0)
  ct.ok(exit.calledWith(1))
})

t.test('prints API error JSON and sets a failing exit code', async ct => {
  const { action } = loadAction({
    response: {
      statusCode: 401,
      body: { text: async () => '{"error":{"code":"UNAUTHORIZED"}}' }
    }
  })
  const log = sinon.stub(console, 'log')

  await action.call({
    args: ['https://armor.dotenvx.com/api/armor/keypairs'],
    opts: () => ({})
  })

  ct.match(log.firstCall.args[0], /UNAUTHORIZED/)
  ct.equal(process.exitCode, 1)
})
