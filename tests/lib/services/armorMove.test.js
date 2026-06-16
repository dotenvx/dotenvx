const t = require('tap')
const sinon = require('sinon')

const readEnvKeyPath = require.resolve('../../../src/lib/helpers/readEnvKey')
const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const getAccountPath = require.resolve('../../../src/lib/api/getAccount')
const postArmorMovePath = require.resolve('../../../src/lib/api/postArmorMove')
const armorMovePath = require.resolve('../../../src/lib/services/armorMove')

function loadArmorMoveWithStubs ({ readEnvKeyExport, promptsExport, getAccountExport, postArmorMoveExport }) {
  const originalReadEnvKey = require(readEnvKeyPath)
  const originalPrompts = require(promptsPath)
  const originalGetAccount = require(getAccountPath)
  const originalPostArmorMove = require(postArmorMovePath)

  require.cache[readEnvKeyPath].exports = readEnvKeyExport
  require.cache[promptsPath].exports = promptsExport
  require.cache[getAccountPath].exports = getAccountExport
  require.cache[postArmorMovePath].exports = postArmorMoveExport
  delete require.cache[armorMovePath]
  require(armorMovePath)

  return () => {
    require.cache[readEnvKeyPath].exports = originalReadEnvKey
    require.cache[promptsPath].exports = originalPrompts
    require.cache[getAccountPath].exports = originalGetAccount
    require.cache[postArmorMovePath].exports = originalPostArmorMove
    delete require.cache[armorMovePath]
  }
}

t.test('ArmorMove reads public key, prompts for team, and posts move request', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const selectStub = sandbox.stub().resolves('hackclub')
  const getAccountRunStub = sandbox.stub().resolves({
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'hackclub' },
      { provider_slug: 'motdotla' }
    ]
  })
  const postRunStub = sandbox.stub().resolves({ changed: true, team: 'hackclub' })
  const GetAccountStub = sandbox.stub().callsFake(function (hostname, token) {
    this.run = getAccountRunStub
    this.args = { hostname, token }
  })
  const PostArmorMoveStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = postRunStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorMoveWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: selectStub },
    getAccountExport: GetAccountStub,
    postArmorMoveExport: PostArmorMoveStub
  })
  const ArmorMove = require(armorMovePath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorMove('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY_PRODUCTION', '.env.production', {
    strict: true,
    ignore: ['MISSING_PRIVATE_KEY']
  }], 'reads mapped public key name from env file')
  ct.same(GetAccountStub.firstCall && GetAccountStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1'], 'fetches account organizations')
  ct.same(selectStub.firstCall && selectStub.firstCall.args, [{
    message: 'Select team',
    choices: [
      { name: 'dotenvx', value: 'dotenvx' },
      { name: 'hackclub', value: 'hackclub' },
      { name: 'motdotla', value: 'motdotla' }
    ]
  }, {
    input: process.stdin,
    output: process.stderr
  }], 'prompts with organization provider slugs on stderr')
  ct.same(PostArmorMoveStub.firstCall && PostArmorMoveStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'hackclub'], 'sends selected team to armor move api')
  ct.same(result, {
    changed: true,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    team: 'hackclub',
    privateKeyValue: undefined,
    publicKeyValue: 'pub-from-env'
  }, 'returns api change status and selected team metadata')
})

t.test('ArmorMove returns unchanged when api reports no change', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const postRunStub = sandbox.stub().resolves({ changed: false, team: 'dotenvx' })
  const restore = loadArmorMoveWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: sandbox.stub().resolves('dotenvx') },
    getAccountExport: sandbox.stub().callsFake(function () {
      this.run = sandbox.stub().resolves({
        organizations: [{ provider_slug: 'dotenvx' }]
      })
    }),
    postArmorMoveExport: sandbox.stub().callsFake(function () {
      this.run = postRunStub
    })
  })
  const ArmorMove = require(armorMovePath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorMove('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(postRunStub.callCount, 1, 'runs move api request once')
  ct.same(result, {
    changed: false,
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    team: 'dotenvx',
    privateKeyValue: undefined,
    publicKeyValue: 'pub-from-env'
  }, 'preserves unchanged status')
})
