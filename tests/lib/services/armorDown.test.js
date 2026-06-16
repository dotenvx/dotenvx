const t = require('tap')
const sinon = require('sinon')

const dotenvxPath = require.resolve('../../../src/lib/main')
const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const postArmorDownPath = require.resolve('../../../src/lib/api/postArmorDown')
const upsertEnvKeyPath = require.resolve('../../../src/lib/helpers/upsertEnvKey')
const armorDownPath = require.resolve('../../../src/lib/services/armorDown')

function loadArmorDownWithStubs ({ dotenvxExport, promptsExport, postArmorDownExport, upsertEnvKeyExport }) {
  const originalDotenvx = require(dotenvxPath)
  const originalPrompts = require(promptsPath)
  const originalPostArmorDown = require(postArmorDownPath)
  const originalUpsertEnvKey = require(upsertEnvKeyPath)

  require.cache[dotenvxPath].exports = dotenvxExport
  require.cache[promptsPath].exports = promptsExport
  require.cache[postArmorDownPath].exports = postArmorDownExport
  require.cache[upsertEnvKeyPath].exports = upsertEnvKeyExport
  delete require.cache[armorDownPath]
  require(armorDownPath)

  return () => {
    require.cache[dotenvxPath].exports = originalDotenvx
    require.cache[promptsPath].exports = originalPrompts
    require.cache[postArmorDownPath].exports = originalPostArmorDown
    require.cache[upsertEnvKeyPath].exports = originalUpsertEnvKey
    delete require.cache[armorDownPath]
  }
}

t.test('ArmorDown pulls private key back into .env.keys', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const upsertStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true
  })
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const PostArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY_PRODUCTION', {
    path: '.env.production',
    strict: true,
    ignore: ['MISSING_PRIVATE_KEY'],
    noArmor: true
  }], 'reads public key from env file')
  ct.equal(selectStub.callCount, 0, 'does not prompt before first api request')
  ct.same(PostArmorDownStub.firstCall && PostArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'sends public key without team first')
  ct.same(upsertStub.firstCall && upsertStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION', 'priv-from-api'], 'upserts private key back into .env.keys')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local write metadata')
})

t.test('ArmorDown surfaces remote changed flag even if local file was already current', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const upsertStub = sandbox.stub().returns({ changed: false })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: false
  })
  const PostArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: sandbox.stub() },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(upsertStub.callCount, 1, 'still attempts local upsert')
  ct.equal(result.changed, false, 'surfaces remote changed flag')
})

t.test('ArmorDown sends explicit team without prompt or retry', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const upsertStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production', 'hackclub').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when team is provided')
  ct.equal(PostArmorDownStub.callCount, 1, 'posts armor down once')
  ct.same(PostArmorDownStub.firstCall && PostArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'hackclub'], 'sends explicit team on first request')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local write metadata')
})

t.test('ArmorDown prompts for team and retries when api requires team', async (ct) => {
  const sandbox = sinon.createSandbox()
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor down')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'hackclub' },
      { provider_slug: 'motdotla' }
    ]
  }
  const getStub = sandbox.stub().returns('pub-from-env')
  const selectStub = sandbox.stub().resolves('hackclub')
  const upsertStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub()
  runStub.onFirstCall().rejects(requiredError)
  runStub.onSecondCall().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub'
  })
  const PostArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.same(PostArmorDownStub.firstCall && PostArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'tries without team first')
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
  ct.same(PostArmorDownStub.secondCall && PostArmorDownStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'hackclub'], 'retries with selected team')
  ct.equal(PostArmorDownStub.callCount, 2, 'only retries once')
  ct.same(upsertStub.firstCall && upsertStub.firstCall.args, ['DOTENV_PRIVATE_KEY', 'priv-from-api'], 'upserts private key after retry succeeds')
  ct.same(result, {
    private_key: 'priv-from-api',
    changed: true,
    team: 'hackclub',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns retry response plus local write metadata')
})

t.test('ArmorDown uses only team from required error meta without prompting', async (ct) => {
  const sandbox = sinon.createSandbox()
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor down')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [{ provider_slug: 'dotenvx' }]
  }
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const upsertStub = sandbox.stub().returns({ changed: true })
  const runStub = sandbox.stub()
  runStub.onFirstCall().rejects(requiredError)
  runStub.onSecondCall().resolves({
    private_key: 'priv-from-api',
    changed: true,
    team: 'dotenvx'
  })
  const PostArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: sandbox.stub().returns('pub-from-env') },
    promptsExport: { select: selectStub },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when error meta has one team')
  ct.same(PostArmorDownStub.firstCall && PostArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'tries without team first')
  ct.same(PostArmorDownStub.secondCall && PostArmorDownStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'dotenvx'], 'retries with only returned team')
})

t.test('ArmorDown rethrows non-team-required api errors', async (ct) => {
  const sandbox = sinon.createSandbox()
  const expectedError = new Error('boom')
  expectedError.code = 'UNAUTHORIZED'
  const PostArmorDownStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(expectedError)
  })
  const restore = loadArmorDownWithStubs({
    dotenvxExport: { get: sandbox.stub().returns('pub-from-env') },
    promptsExport: { select: sandbox.stub() },
    postArmorDownExport: PostArmorDownStub,
    upsertEnvKeyExport: sandbox.stub()
  })
  const ArmorDown = require(armorDownPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await ct.rejects(new ArmorDown('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run(), expectedError)
})
