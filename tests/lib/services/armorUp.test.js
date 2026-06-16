const t = require('tap')
const sinon = require('sinon')

const dotenvxPath = require.resolve('../../../src/lib/main')
const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const postArmorUpPath = require.resolve('../../../src/lib/api/postArmorUp')
const removeEnvKeyPath = require.resolve('../../../src/lib/helpers/removeEnvKey')
const armorUpPath = require.resolve('../../../src/lib/services/armorUp')

function loadArmorUpWithStubs ({ dotenvxExport, promptsExport, postArmorUpExport, removeEnvKeyExport }) {
  const originalDotenvx = require(dotenvxPath)
  const originalPrompts = require(promptsPath)
  const originalPostArmorUp = require(postArmorUpPath)
  const originalRemoveEnvKey = require(removeEnvKeyPath)

  require.cache[dotenvxPath].exports = dotenvxExport
  require.cache[promptsPath].exports = promptsExport
  require.cache[postArmorUpPath].exports = postArmorUpExport
  require.cache[removeEnvKeyPath].exports = removeEnvKeyExport
  delete require.cache[armorUpPath]
  require(armorUpPath)

  return () => {
    require.cache[dotenvxPath].exports = originalDotenvx
    require.cache[promptsPath].exports = originalPrompts
    require.cache[postArmorUpPath].exports = originalPostArmorUp
    require.cache[removeEnvKeyPath].exports = originalRemoveEnvKey
    delete require.cache[armorUpPath]
  }
}

t.test('ArmorUp pushes private key and removes it from .env.keys', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub()
  getStub.onFirstCall().returns('pub-from-env')
  getStub.onSecondCall().returns('priv-from-env-keys')
  const selectStub = sandbox.stub()
  const removeStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: false
  })
  const PostArmorUpStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, privateKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, privateKey, team }
  })
  const restore = loadArmorUpWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorUpExport: PostArmorUpStub,
    removeEnvKeyExport: removeStub
  })
  const ArmorUp = require(armorUpPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorUp('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY_PRODUCTION', {
    path: '.env.production',
    strict: true,
    ignore: ['MISSING_PRIVATE_KEY'],
    noArmor: true
  }], 'reads public key from env file')
  ct.same(getStub.secondCall && getStub.secondCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION', {
    path: '.env.keys',
    strict: true,
    ignore: ['MISSING_KEY'],
    noArmor: true
  }], 'reads private key from .env.keys')
  ct.equal(selectStub.callCount, 0, 'does not prompt when armor up succeeds without team')
  ct.same(PostArmorUpStub.firstCall && PostArmorUpStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'priv-from-env-keys', undefined], 'first tries armor up without team')
  ct.same(removeStub.firstCall && removeStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION'], 'removes the local private key after a successful armor up')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: false,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local removal metadata')
})

t.test('ArmorUp still calls api when local private key is already absent', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub()
  getStub.onFirstCall().returns('pub-from-env')
  getStub.onSecondCall().returns(undefined)
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const removeStub = sandbox.stub().returns({ changed: false })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true
  })
  const PostArmorUpStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, privateKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, privateKey, team }
  })
  const restore = loadArmorUpWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorUpExport: PostArmorUpStub,
    removeEnvKeyExport: removeStub
  })
  const ArmorUp = require(armorUpPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorUp('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when armor up succeeds without team')
  ct.same(PostArmorUpStub.firstCall && PostArmorUpStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined, undefined], 'sends public key without team even when local private key is absent')
  ct.same(removeStub.firstCall && removeStub.firstCall.args, ['DOTENV_PRIVATE_KEY'], 'still attempts local removal when no local private key exists')
  ct.equal(result.changed, true, 'surfaces remote changed flag')
})

t.test('ArmorUp sends explicit team without prompt or retry', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub()
  getStub.onFirstCall().returns('pub-from-env')
  getStub.onSecondCall().returns('priv-from-env-keys')
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const removeStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorUpStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, privateKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, privateKey, team }
  })
  const restore = loadArmorUpWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorUpExport: PostArmorUpStub,
    removeEnvKeyExport: removeStub
  })
  const ArmorUp = require(armorUpPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorUp('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production', 'hackclub').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when team is provided')
  ct.equal(PostArmorUpStub.callCount, 1, 'posts armor up once')
  ct.same(PostArmorUpStub.firstCall && PostArmorUpStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'priv-from-env-keys', 'hackclub'], 'sends explicit team on first request')
  ct.same(removeStub.firstCall && removeStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION'], 'removes local private key after success')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local metadata')
})

t.test('ArmorUp retries with selected team when api requires team', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub()
  getStub.onFirstCall().returns('pub-from-env')
  getStub.onSecondCall().returns('priv-from-env-keys')
  const selectStub = sandbox.stub().resolves('hackclub')
  const removeStub = sandbox.stub().returns({ changed: true })
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor up')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'hackclub' },
      { provider_slug: 'motdotla' }
    ]
  }
  const firstRunStub = sandbox.stub().rejects(requiredError)
  const secondRunStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorUpStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, privateKey, team) {
    this.run = PostArmorUpStub.callCount === 1 ? firstRunStub : secondRunStub
    this.args = { hostname, token, devicePublicKey, publicKey, privateKey, team }
  })
  const restore = loadArmorUpWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorUpExport: PostArmorUpStub,
    removeEnvKeyExport: removeStub
  })
  const ArmorUp = require(armorUpPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorUp('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.equal(PostArmorUpStub.callCount, 2, 'posts armor up twice')
  ct.same(PostArmorUpStub.firstCall && PostArmorUpStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'priv-from-env-keys', undefined], 'first tries without team')
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
  }], 'prompts with teams from api error meta on stderr')
  ct.same(PostArmorUpStub.secondCall && PostArmorUpStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'priv-from-env-keys', 'hackclub'], 'retries with selected team')
  ct.same(removeStub.firstCall && removeStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION'], 'removes local private key after retry succeeds')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns retry response plus local metadata')
})

t.test('ArmorUp rethrows non-team-required api errors', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub()
  getStub.onFirstCall().returns('pub-from-env')
  getStub.onSecondCall().returns('priv-from-env-keys')
  const expectedError = new Error('boom')
  expectedError.code = 'UNAUTHORIZED'
  const PostArmorUpStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(expectedError)
  })
  const restore = loadArmorUpWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: sandbox.stub() },
    postArmorUpExport: PostArmorUpStub,
    removeEnvKeyExport: sandbox.stub()
  })
  const ArmorUp = require(armorUpPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await ct.rejects(new ArmorUp('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run(), expectedError)
})
