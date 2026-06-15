const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

function response (statusCode, json) {
  return {
    statusCode,
    body: {
      json: async () => json
    }
  }
}

t.beforeEach(() => {
  sinon.restore()
})

t.test('PostLogout posts logout with bearer token', async ct => {
  const http = sinon.stub().resolves(response(200, { ok: true }))
  const PostLogout = proxyquire('../../../src/lib/api/postLogout', {
    '../helpers/http': { http }
  })

  const out = await new PostLogout('https://armor.example.com', 'token-123').run()

  ct.same(out, { ok: true })
  ct.equal(http.firstCall.args[0], 'https://armor.example.com/api/logout')
  ct.equal(http.firstCall.args[1].method, 'POST')
  ct.same(http.firstCall.args[1].headers, {
    Authorization: 'Bearer token-123',
    'Content-Type': 'application/json'
  })
  ct.same(JSON.parse(http.firstCall.args[1].body), {})
})

t.test('PostLogout sends empty bearer token when token is missing', async ct => {
  const http = sinon.stub().resolves(response(200, { ok: true }))
  const PostLogout = proxyquire('../../../src/lib/api/postLogout', {
    '../helpers/http': { http }
  })

  await new PostLogout('https://armor.example.com', null).run()
  await new PostLogout('https://armor.example.com', undefined).run()

  ct.equal(http.firstCall.args[1].headers.Authorization, 'Bearer ')
  ct.equal(http.secondCall.args[1].headers.Authorization, 'Bearer ')
})

t.test('PostLogout throws api errors', async ct => {
  const json = { error: { code: 'UNAUTHORIZED', message: 'bad token', help: 'login again' } }
  const http = sinon.stub().resolves(response(401, json))
  const PostLogout = proxyquire('../../../src/lib/api/postLogout', {
    '../helpers/http': { http }
  })

  await ct.rejects(new PostLogout('https://armor.example.com', 'token-123').run(), {
    code: 'UNAUTHORIZED',
    help: '[UNAUTHORIZED] login again',
    json
  })
})

t.test('PostLogout api error falls back to status and json help', async ct => {
  const json = { error: { message: 'bad token' } }
  const http = sinon.stub().resolves(response(401, json))
  const PostLogout = proxyquire('../../../src/lib/api/postLogout', {
    '../helpers/http': { http }
  })

  await ct.rejects(new PostLogout('https://armor.example.com', 'token-123').run(), {
    code: '401',
    help: `[401] ${JSON.stringify(json)}`
  })
})
