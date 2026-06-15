const t = require('tap')
const sinon = require('sinon')

const httpPath = require.resolve('../../../src/lib/helpers/http')
const buildApiErrorPath = require.resolve('../../../src/lib/helpers/buildApiError')
const packageJsonPath = require.resolve('../../../src/lib/helpers/packageJson')
const postArmorDownPath = require.resolve('../../../src/lib/api/postArmorDown')

function loadPostArmorDownWithStubs ({ httpStub, buildApiErrorStub, packageJsonStub }) {
  const originalHttpModule = require(httpPath)
  const originalBuildApiError = require(buildApiErrorPath)
  const originalPackageJson = require(packageJsonPath)

  require.cache[httpPath].exports = { http: httpStub }
  require.cache[buildApiErrorPath].exports = buildApiErrorStub
  require.cache[packageJsonPath].exports = packageJsonStub
  delete require.cache[postArmorDownPath]

  const PostArmorDown = require(postArmorDownPath)

  return {
    PostArmorDown,
    restore: () => {
      require.cache[httpPath].exports = originalHttpModule
      require.cache[buildApiErrorPath].exports = originalBuildApiError
      require.cache[packageJsonPath].exports = originalPackageJson
      delete require.cache[postArmorDownPath]
    }
  }
}

t.test('PostArmorDown.run sends public key and team in request body', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (url, opts) => {
    ct.equal(url, 'https://armor.dotenvx.com/api/armor/down', 'posts to armor down endpoint')
    ct.equal(opts.method, 'POST', 'uses POST')
    ct.equal(opts.headers.Authorization, 'Bearer ', 'sends empty bearer token')
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      public_key: 'public-key',
      team: 'dotenvx'
    }, 'sends public key and team in request body')

    return {
      statusCode: 200,
      body: {
        json: async () => ({ private_key: 'private-key', changed: true })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostArmorDown, restore } = loadPostArmorDownWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  const result = await new PostArmorDown('https://armor.dotenvx.com', undefined, 'device-public-key', 'public-key', 'dotenvx').run()

  ct.same(result, { private_key: 'private-key', changed: true }, 'returns response json')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostArmorDown.run throws buildApiError output on non-2xx status', async (ct) => {
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

  const { PostArmorDown, restore } = loadPostArmorDownWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await ct.rejects(new PostArmorDown('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'public-key', 'dotenvx').run(), expectedError)
  ct.equal(buildApiErrorStub.callCount, 1, 'builds api error once')
  ct.same(buildApiErrorStub.firstCall.args, [401, json], 'passes status code and json to buildApiError')

  restore()
  sandbox.restore()
})
