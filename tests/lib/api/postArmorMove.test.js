const t = require('tap')
const sinon = require('sinon')

const httpPath = require.resolve('../../../src/lib/helpers/http')
const buildApiErrorPath = require.resolve('../../../src/lib/helpers/buildApiError')
const packageJsonPath = require.resolve('../../../src/lib/helpers/packageJson')
const postArmorMovePath = require.resolve('../../../src/lib/api/postArmorMove')

function loadPostArmorMoveWithStubs ({ httpStub, buildApiErrorStub, packageJsonStub }) {
  const originalHttpModule = require(httpPath)
  const originalBuildApiError = require(buildApiErrorPath)
  const originalPackageJson = require(packageJsonPath)

  require.cache[httpPath].exports = { http: httpStub }
  require.cache[buildApiErrorPath].exports = buildApiErrorStub
  require.cache[packageJsonPath].exports = packageJsonStub
  delete require.cache[postArmorMovePath]

  const PostArmorMove = require(postArmorMovePath)

  return {
    PostArmorMove,
    restore: () => {
      require.cache[httpPath].exports = originalHttpModule
      require.cache[buildApiErrorPath].exports = originalBuildApiError
      require.cache[packageJsonPath].exports = originalPackageJson
      delete require.cache[postArmorMovePath]
    }
  }
}

t.test('PostArmorMove.run sends public key and team in request body', async (ct) => {
  const sandbox = sinon.createSandbox()

  const httpStub = sandbox.stub().callsFake(async (url, opts) => {
    ct.equal(url, 'https://armor.dotenvx.com/api/armor/move', 'posts to armor move endpoint')
    ct.equal(opts.method, 'POST', 'uses POST')
    ct.equal(opts.headers.Authorization, 'Bearer token-123', 'sends bearer token')
    ct.same(JSON.parse(opts.body), {
      device_public_key: 'device-public-key',
      cli_version: '0.0.0-test',
      public_key: 'public-key',
      team: 'dotenvx'
    }, 'sends public key and destination team in request body')

    return {
      statusCode: 200,
      body: {
        json: async () => ({ changed: true, team: 'dotenvx' })
      }
    }
  })

  const buildApiErrorStub = sandbox.stub()
  const packageJsonStub = { version: '0.0.0-test' }
  const { PostArmorMove, restore } = loadPostArmorMoveWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  const result = await new PostArmorMove('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'public-key', 'dotenvx').run()

  ct.same(result, { changed: true, team: 'dotenvx' }, 'returns response json')
  ct.equal(buildApiErrorStub.callCount, 0, 'does not build api error for success')

  restore()
  sandbox.restore()
})

t.test('PostArmorMove.run throws buildApiError output on non-2xx status', async (ct) => {
  const sandbox = sinon.createSandbox()

  const json = { error: { code: 'FORBIDDEN', message: 'not a member of team', help: 'choose another team' } }
  const expectedError = new Error('[FORBIDDEN] not a member of team')
  const httpStub = sandbox.stub().resolves({
    statusCode: 403,
    body: {
      json: async () => json
    }
  })
  const buildApiErrorStub = sandbox.stub().returns(expectedError)
  const packageJsonStub = { version: '0.0.0-test' }

  const { PostArmorMove, restore } = loadPostArmorMoveWithStubs({ httpStub, buildApiErrorStub, packageJsonStub })

  await ct.rejects(new PostArmorMove('https://armor.dotenvx.com', 'token-123', 'device-public-key', 'public-key', 'dotenvx').run(), expectedError)
  ct.equal(buildApiErrorStub.callCount, 1, 'builds api error once')
  ct.same(buildApiErrorStub.firstCall.args, [403, json], 'passes status code and json to buildApiError')

  restore()
  sandbox.restore()
})
