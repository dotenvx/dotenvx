const t = require('tap')
const sinon = require('sinon')

const httpPath = require.resolve('../../../src/lib/helpers/http')
const buildApiErrorPath = require.resolve('../../../src/lib/helpers/buildApiError')
const packageJsonPath = require.resolve('../../../src/lib/helpers/packageJson')
const postArmorPushPath = require.resolve('../../../src/lib/api/postArmorPush')

function loadPostArmorPushWithStubs ({ httpStub, buildApiErrorStub, packageJsonStub }) {
  const originalHttpModule = require(httpPath)
  const originalBuildApiError = require(buildApiErrorPath)
  const originalPackageJson = require(packageJsonPath)

  require.cache[httpPath].exports = { http: httpStub }
  require.cache[buildApiErrorPath].exports = buildApiErrorStub
  require.cache[packageJsonPath].exports = packageJsonStub
  delete require.cache[postArmorPushPath]

  const PostArmorPush = require(postArmorPushPath)

  return {
    PostArmorPush,
    restore: () => {
      require.cache[httpPath].exports = originalHttpModule
      require.cache[buildApiErrorPath].exports = originalBuildApiError
      require.cache[packageJsonPath].exports = originalPackageJson
      delete require.cache[postArmorPushPath]
    }
  }
}

t.test('PostArmorPush.run sends private key and team in request body', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (url, opts) => {
    ct.equal(url, 'https://armor.dotenvx.com/api/armor/push', 'posts to armor push endpoint')
    ct.equal(opts.method, 'POST', 'uses POST')
    ct.equal(opts.headers.Authorization, 'Bearer token-123', 'sends bearer token')
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      private_key: 'private-key',
      team: 'dotenvx'
    }, 'sends private key and destination team in request body')

    return {
      statusCode: 200,
      body: {
        json: async () => ({ changed: true, team: 'dotenvx' })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostArmorPush, restore } = loadPostArmorPushWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  const result = await new PostArmorPush('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'private-key', 'dotenvx').run()

  ct.same(result, { changed: true, team: 'dotenvx' }, 'returns response json')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostArmorPush.run throws buildApiError output on non-2xx status', async (ct) => {
  const sandbox = sinon.createSandbox()

  const json = { error: { code: 'UNAUTHORIZED', message: 'bad token', help: 'login again' } }
  const expectedError = new Error('[UNAUTHORIZED] bad token')
  const httpStub = sandbox.stub().resolves({
    statusCode: 401,
    body: {
      json: async () => json
    }
  })
  const buildApiErrorStub = sandbox.stub().returns(expectedError)
  const packageJsonStub = { version: '0.0.0-test' }

  const { PostArmorPush, restore } = loadPostArmorPushWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await ct.rejects(new PostArmorPush('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'private-key', 'dotenvx').run(), expectedError)
  ct.equal(buildApiErrorStub.callCount, 1, 'builds api error once')
  ct.same(buildApiErrorStub.firstCall.args, [401, json], 'passes status code and json to buildApiError')

  restore()
  sandbox.restore()
})
