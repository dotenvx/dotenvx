const t = require('tap')
const sinon = require('sinon')

const httpPath = require.resolve('../../../src/lib/helpers/http')
const buildApiErrorPath = require.resolve('../../../src/lib/helpers/buildApiError')
const packageJsonPath = require.resolve('../../../src/lib/helpers/packageJson')
const postArmorUpPath = require.resolve('../../../src/lib/api/postArmorUp')

function loadPostArmorUpWithStubs ({ httpStub, buildApiErrorStub, packageJsonStub }) {
  const originalHttpModule = require(httpPath)
  const originalBuildApiError = require(buildApiErrorPath)
  const originalPackageJson = require(packageJsonPath)

  require.cache[httpPath].exports = { http: httpStub }
  require.cache[buildApiErrorPath].exports = buildApiErrorStub
  require.cache[packageJsonPath].exports = packageJsonStub
  delete require.cache[postArmorUpPath]

  const PostArmorUp = require(postArmorUpPath)

  return {
    PostArmorUp,
    restore: () => {
      require.cache[httpPath].exports = originalHttpModule
      require.cache[buildApiErrorPath].exports = originalBuildApiError
      require.cache[packageJsonPath].exports = originalPackageJson
      delete require.cache[postArmorUpPath]
    }
  }
}

t.test('PostArmorUp.run sends public and private keys when both are present', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (url, opts) => {
    ct.equal(url, 'https://armor.dotenvx.com/api/armor/up', 'posts to armor up endpoint')
    ct.equal(opts.method, 'POST', 'uses POST')
    ct.equal(opts.headers.Authorization, 'Bearer ', 'sends empty bearer token')
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      public_key: 'public-key',
      private_key: 'private-key',
      team: 'dotenvx'
    }, 'sends public and private keys with team in request body')

    return {
      statusCode: 200,
      body: {
        json: async () => ({ changed: true })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostArmorUp, restore } = loadPostArmorUpWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  const result = await new PostArmorUp('https://armor.dotenvx.com', undefined, 'device-public-key', 'public-key', 'private-key', 'dotenvx').run()

  ct.same(result, { changed: true }, 'returns response json')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostArmorUp.run sends null private key when it is not present locally', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (_url, opts) => {
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      public_key: 'public-key',
      private_key: null,
      team: 'dotenvx'
    }, 'sends public key, null private key, and team when local private key is absent')
    return {
      statusCode: 200,
      body: {
        json: async () => ({ changed: false })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostArmorUp, restore } = loadPostArmorUpWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await new PostArmorUp('https://armor.dotenvx.com', null, 'device-public-key', 'public-key', null, 'dotenvx').run()

  ct.equal(httpStub.callCount, 1, 'makes one request')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostArmorUp.run throws buildApiError output on non-2xx status', async (ct) => {
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

  const { PostArmorUp, restore } = loadPostArmorUpWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await ct.rejects(new PostArmorUp('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'public-key', null).run(), expectedError)
  ct.equal(buildApiErrorStub.callCount, 1, 'builds api error once')
  ct.same(buildApiErrorStub.firstCall.args, [401, json], 'passes status code and json to buildApiError')

  restore()
  sandbox.restore()
})
