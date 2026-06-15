const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

t.test('GetAccount.run fetches account with bearer token', async ct => {
  const http = sinon.stub().resolves({
    statusCode: 200,
    body: {
      json: async () => ({ organizations: [{ provider_slug: 'dotenvx' }] })
    }
  })
  const buildApiError = sinon.stub()

  const GetAccount = proxyquire('../../../src/lib/api/getAccount', {
    '../helpers/http': { http },
    '../helpers/buildApiError': buildApiError
  })

  const out = await new GetAccount('https://armor.example.com', 'token-123').run()

  ct.equal(http.firstCall.args[0], 'https://armor.example.com/api/account')
  ct.same(http.firstCall.args[1], {
    method: 'GET',
    headers: {
      Authorization: 'Bearer token-123',
      'Content-Type': 'application/json'
    }
  })
  ct.same(out, { organizations: [{ provider_slug: 'dotenvx' }] })
  ct.equal(buildApiError.callCount, 0)
})

t.test('GetAccount.run throws buildApiError output on non-2xx status', async ct => {
  const json = { error: { code: 'UNAUTHORIZED', message: 'bad token', help: 'login again' } }
  const expectedError = new Error('[UNAUTHORIZED] bad token')
  const http = sinon.stub().resolves({
    statusCode: 401,
    body: {
      json: async () => json
    }
  })
  const buildApiError = sinon.stub().returns(expectedError)

  const GetAccount = proxyquire('../../../src/lib/api/getAccount', {
    '../helpers/http': { http },
    '../helpers/buildApiError': buildApiError
  })

  await ct.rejects(new GetAccount('https://armor.example.com', 'token-123').run(), expectedError)
  ct.same(buildApiError.firstCall.args, [401, json])
})
