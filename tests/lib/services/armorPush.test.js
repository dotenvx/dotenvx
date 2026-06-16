const t = require('tap')
const sinon = require('sinon')

const readEnvKeyPath = require.resolve('../../../src/lib/helpers/readEnvKey')
const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const postArmorPushPath = require.resolve('../../../src/lib/api/postArmorPush')
const armorPushPath = require.resolve('../../../src/lib/services/armorPush')
const localKeypair = require('../../../src/lib/helpers/cryptography/localKeypair')

function loadArmorPushWithStubs ({ readEnvKeyExport, promptsExport, postArmorPushExport }) {
  const originalReadEnvKey = require(readEnvKeyPath)
  const originalPrompts = require(promptsPath)
  const originalPostArmorPush = require(postArmorPushPath)

  require.cache[readEnvKeyPath].exports = readEnvKeyExport
  require.cache[promptsPath].exports = promptsExport
  require.cache[postArmorPushPath].exports = postArmorPushExport
  delete require.cache[armorPushPath]
  require(armorPushPath)

  return () => {
    require.cache[readEnvKeyPath].exports = originalReadEnvKey
    require.cache[promptsPath].exports = originalPrompts
    require.cache[postArmorPushPath].exports = originalPostArmorPush
    delete require.cache[armorPushPath]
  }
}

t.test('ArmorPush reads private key and posts push request without prompting first', async (ct) => {
  const sandbox = sinon.createSandbox()
  const keypair = localKeypair()
  const getStub = sandbox.stub().returns(keypair.privateKey)
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const postRunStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: null
  })
  const PostArmorPushStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, privateKey, team) {
    this.run = postRunStub
    this.args = { hostname, token, devicePublicKey, privateKey, team }
  })
  const restore = loadArmorPushWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: selectStub },
    postArmorPushExport: PostArmorPushStub
  })
  const ArmorPush = require(armorPushPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPush('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION', '.env.keys', {
    strict: true
  }], 'reads mapped private key from .env.keys')
  ct.equal(selectStub.callCount, 0, 'does not prompt before first api request')
  ct.same(PostArmorPushStub.firstCall && PostArmorPushStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', keypair.privateKey, undefined], 'sends private key without team first')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: null,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: keypair.publicKey
  }, 'returns api json plus private key metadata')
})

t.test('ArmorPush prompts for team and retries when api requires team', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('priv-from-env-keys')
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor push')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'hackclub' },
      { provider_slug: 'motdotla' }
    ]
  }
  const selectStub = sandbox.stub().resolves('hackclub')
  const postRunStub = sandbox.stub()
  postRunStub.onFirstCall().rejects(requiredError)
  postRunStub.onSecondCall().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorPushStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, privateKey, team) {
    this.run = postRunStub
    this.args = { hostname, token, devicePublicKey, privateKey, team }
  })
  const restore = loadArmorPushWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: selectStub },
    postArmorPushExport: PostArmorPushStub
  })
  const ArmorPush = require(armorPushPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPush('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.same(PostArmorPushStub.firstCall && PostArmorPushStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'priv-from-env-keys', undefined], 'tries without team first')
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
  }], 'prompts with organization provider slugs from error meta on stderr')
  ct.same(PostArmorPushStub.secondCall && PostArmorPushStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'priv-from-env-keys', 'hackclub'], 'retries with selected team')
  ct.equal(PostArmorPushStub.callCount, 2, 'only retries once')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: ''
  }, 'returns api json plus private key metadata')
})

t.test('ArmorPush sends explicit team without prompt or retry', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('priv-from-env-keys')
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const postRunStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorPushStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, privateKey, team) {
    this.run = postRunStub
    this.args = { hostname, token, devicePublicKey, privateKey, team }
  })
  const restore = loadArmorPushWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: selectStub },
    postArmorPushExport: PostArmorPushStub
  })
  const ArmorPush = require(armorPushPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPush('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production', 'hackclub').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when team is provided')
  ct.equal(PostArmorPushStub.callCount, 1, 'posts armor push once')
  ct.same(PostArmorPushStub.firstCall && PostArmorPushStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'priv-from-env-keys', 'hackclub'], 'sends explicit team on first request')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: ''
  }, 'returns api json plus private key metadata')
})

t.test('ArmorPush uses only team from required error meta without prompting', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('priv-from-env-keys')
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor push')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [{ provider_slug: 'dotenvx' }]
  }
  const postRunStub = sandbox.stub()
  postRunStub.onFirstCall().rejects(requiredError)
  postRunStub.onSecondCall().resolves({ changed: true, team: 'dotenvx' })
  const PostArmorPushStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, privateKey, team) {
    this.run = postRunStub
    this.args = { hostname, token, devicePublicKey, privateKey, team }
  })
  const restore = loadArmorPushWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: selectStub },
    postArmorPushExport: PostArmorPushStub
  })
  const ArmorPush = require(armorPushPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await new ArmorPush('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when error meta has one team')
  ct.same(PostArmorPushStub.firstCall && PostArmorPushStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'priv-from-env-keys', undefined], 'tries without team first')
  ct.same(PostArmorPushStub.secondCall && PostArmorPushStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'priv-from-env-keys', 'dotenvx'], 'retries with only returned team')
})

t.test('ArmorPush rethrows non-team-required api errors', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('priv-from-env-keys')
  const expectedError = new Error('boom')
  expectedError.code = 'UNAUTHORIZED'
  const PostArmorPushStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(expectedError)
  })
  const restore = loadArmorPushWithStubs({
    readEnvKeyExport: getStub,
    promptsExport: { select: sandbox.stub() },
    postArmorPushExport: PostArmorPushStub
  })
  const ArmorPush = require(armorPushPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await ct.rejects(new ArmorPush('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run(), expectedError)
})
