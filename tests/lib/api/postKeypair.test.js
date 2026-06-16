const t = require('tap')
const sinon = require('sinon')

const httpPath = require.resolve('../../../src/lib/helpers/http')
const buildApiErrorPath = require.resolve('../../../src/lib/helpers/buildApiError')
const packageJsonPath = require.resolve('../../../src/lib/helpers/packageJson')
const postKeypairPath = require.resolve('../../../src/lib/api/postKeypair')

function loadPostKeypairWithStubs ({ httpStub, buildApiErrorStub, packageJsonStub }) {
  const originalHttpModule = require(httpPath)
  const originalBuildApiError = require(buildApiErrorPath)
  const originalPackageJson = require(packageJsonPath)

  require.cache[httpPath].exports = { http: httpStub }
  require.cache[buildApiErrorPath].exports = buildApiErrorStub
  require.cache[packageJsonPath].exports = packageJsonStub
  delete require.cache[postKeypairPath]

  const PostKeypair = require(postKeypairPath)

  return {
    PostKeypair,
    restore: () => {
      require.cache[httpPath].exports = originalHttpModule
      require.cache[buildApiErrorPath].exports = originalBuildApiError
      require.cache[packageJsonPath].exports = originalPackageJson
      delete require.cache[postKeypairPath]
    }
  }
}

t.test('PostKeypair.run sends keypair request metadata', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (url, opts) => {
    ct.equal(url, 'https://armor.dotenvx.com/api/keypair', 'posts to keypair endpoint')
    ct.equal(opts.method, 'POST', 'uses POST')
    ct.equal(opts.headers.Authorization, 'Bearer token-123', 'sends bearer token')
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      public_key: 'public-key',
      team: 'dotenvx',
      metadata: {
        command: 'dotenvx run -f .env.production -- npm start'
      },
      grant_token: 'grant-token'
    }, 'sends public key, team, metadata, and grant token')

    return {
      statusCode: 200,
      body: {
        json: async () => ({
          public_key: 'public-key',
          private_key: 'private-key'
        })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostKeypair, restore } = loadPostKeypairWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  const result = await new PostKeypair(
    'https://armor.dotenvx.com',
    'token-123',
    'device-public-key',
    'public-key',
    'dotenvx',
    { command: 'dotenvx run -f .env.production -- npm start' },
    'grant-token'
  ).run()

  ct.same(result, {
    public_key: 'public-key',
    private_key: 'private-key'
  }, 'returns response json')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostKeypair.run throws buildApiError output on non-2xx status', async (ct) => {
  const sandbox = sinon.createSandbox()

  const json = { error: { code: 'UNAUTHORIZED', message: 'bad token' } }
  const expectedError = new Error('[UNAUTHORIZED] bad token')
  const httpStub = sandbox.stub().resolves({
    statusCode: 401,
    body: {
      json: async () => json
    }
  })
  const buildApiErrorStub = sandbox.stub().returns(expectedError)
  const packageJsonStub = { version: '0.0.0-test' }

  const { PostKeypair, restore } = loadPostKeypairWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await ct.rejects(new PostKeypair('https://armor.dotenvx.com', 'token-123', 'device-public-key').run(), expectedError)
  ct.equal(buildApiErrorStub.callCount, 1, 'builds api error once')
  ct.same(buildApiErrorStub.firstCall.args, [401, json], 'passes status code and json to buildApiError')

  restore()
  sandbox.restore()
})
