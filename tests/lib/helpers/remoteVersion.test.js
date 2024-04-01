const t = require('tap')
const packageJson = require('../../../src/lib/helpers/packageJson')

const RemoteVersion = require('../../../src/lib/helpers/remoteVersion')

const { MockAgent, setGlobalDispatcher } = require('undici')

const mockAgent = new MockAgent()
mockAgent.disableNetConnect() // prevent network connections
setGlobalDispatcher(mockAgent)

t.test('#run', async ct => {
  const mockPool = mockAgent.get('https://registry.npmjs.org')
  mockPool.intercept({
    path: '/@dotenvx/dotenvx/latest',
    method: 'GET'
  }).reply(200, {
    name: '@dotenvx/dotenvx',
    version: 'X.X.X'
  })

  const remoteVersion = await new RemoteVersion().run()

  ct.same(remoteVersion, 'X.X.X')

  ct.end()
})

t.test('#run 404 status and return packageJson.version', async ct => {
  const mockPool = mockAgent.get('https://registry.npmjs.org')
  mockPool.intercept({
    path: '/@dotenvx/dotenvx/latest',
    method: 'GET'
  }).reply(404, {
  })

  const remoteVersion = await new RemoteVersion().run()

  ct.same(remoteVersion, packageJson.version)

  ct.end()
})

t.test('#run network error', async ct => {
  const mockPool = mockAgent.get('https://registry.npmjs.org')
  mockPool.intercept({
    path: '/@dotenvx/dotenvx/latest',
    method: 'GET'
  }).replyWithError({
    message: 'getaddrinfo ENOTFOUND registry.npmjs.org',
    code: 'ENOTFOUND'
  })

  const remoteVersion = await new RemoteVersion().run()

  ct.same(remoteVersion, packageJson.version)

  ct.end()
})
