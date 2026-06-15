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

t.test('PostOauthDeviceCode posts device login payload', async ct => {
  const http = sinon.stub().resolves(response(200, {
    device_code: 'device-code',
    user_code: 'user-code'
  }))
  const PostOauthDeviceCode = proxyquire('../../../src/lib/api/postOauthDeviceCode', {
    '../helpers/http': { http }
  })

  const out = await new PostOauthDeviceCode('https://armor.example.com', 'device-pub', {
    system_uuid: 'uuid',
    os_platform: 'darwin',
    os_arch: 'arm64'
  }).run()

  ct.same(out, { device_code: 'device-code', user_code: 'user-code' })
  ct.equal(http.firstCall.args[0], 'https://armor.example.com/oauth/device/code')
  ct.same(JSON.parse(http.firstCall.args[1].body), {
    client_id: 'oac_dotenvxcli',
    device_public_key: 'device-pub',
    system_information: {
      system_uuid: 'uuid',
      os_platform: 'darwin',
      os_arch: 'arm64'
    },
    dotenvx_project_id: null
  })
})

t.test('PostOauthDeviceCode throws oauth errors', async ct => {
  const http = sinon.stub().resolves(response(400, {
    error: 'invalid_request',
    error_description: 'bad request'
  }))
  const PostOauthDeviceCode = proxyquire('../../../src/lib/api/postOauthDeviceCode', {
    '../helpers/http': { http }
  })

  await ct.rejects(new PostOauthDeviceCode('https://armor.example.com', 'device-pub', {}).run(), {
    code: 'invalid_request'
  })
})

t.test('PostOauthToken posts oauth device grant', async ct => {
  const http = sinon.stub().resolves(response(200, {
    access_token: 'token-123'
  }))
  const PostOauthToken = proxyquire('../../../src/lib/api/postOauthToken', {
    '../helpers/http': { http }
  })

  const out = await new PostOauthToken('https://armor.example.com', 'device-code').run()

  ct.same(out, { access_token: 'token-123' })
  ct.equal(http.firstCall.args[0], 'https://armor.example.com/oauth/token')
  ct.same(JSON.parse(http.firstCall.args[1].body), {
    client_id: 'oac_dotenvxcli',
    device_code: 'device-code',
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
  })
})

t.test('PostOauthToken throws oauth errors', async ct => {
  const http = sinon.stub().resolves(response(400, {
    error: 'authorization_pending',
    error_description: 'still waiting'
  }))
  const PostOauthToken = proxyquire('../../../src/lib/api/postOauthToken', {
    '../helpers/http': { http }
  })

  await ct.rejects(new PostOauthToken('https://armor.example.com', 'device-code').run(), {
    code: 'authorization_pending'
  })
})
