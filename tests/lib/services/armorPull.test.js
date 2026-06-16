const t = require('tap')
const sinon = require('sinon')

const dotenvxPath = require.resolve('../../../src/lib/main')
const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const postArmorPullPath = require.resolve('../../../src/lib/api/postArmorPull')
const upsertEnvKeyPath = require.resolve('../../../src/lib/helpers/upsertEnvKey')
const armorPullPath = require.resolve('../../../src/lib/services/armorPull')

function loadArmorPullWithStubs ({ dotenvxExport, promptsExport, postArmorPullExport, upsertEnvKeyExport }) {
  const originalDotenvx = require(dotenvxPath)
  const originalPrompts = require(promptsPath)
  const originalPostArmorPull = require(postArmorPullPath)
  const originalUpsertEnvKey = require(upsertEnvKeyPath)

  require.cache[dotenvxPath].exports = dotenvxExport
  require.cache[promptsPath].exports = promptsExport
  require.cache[postArmorPullPath].exports = postArmorPullExport
  require.cache[upsertEnvKeyPath].exports = upsertEnvKeyExport
  delete require.cache[armorPullPath]
  require(armorPullPath)

  return () => {
    require.cache[dotenvxPath].exports = originalDotenvx
    require.cache[promptsPath].exports = originalPrompts
    require.cache[postArmorPullPath].exports = originalPostArmorPull
    require.cache[upsertEnvKeyPath].exports = originalUpsertEnvKey
    delete require.cache[armorPullPath]
  }
}

t.test('ArmorPull reads environment-specific public key and upserts private key', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const runStub = sandbox.stub().resolves({
    public_key: 'pub-from-api',
    private_key: 'priv-from-api'
  })
  const upsertStub = sandbox.stub().returns({ changed: true })
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const PostArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production').run()

  ct.same(getStub.firstCall && getStub.firstCall.args, ['DOTENV_PUBLIC_KEY_PRODUCTION', {
    path: '.env.production',
    strict: true,
    ignore: ['MISSING_PRIVATE_KEY'],
    noArmor: true
  }], 'reads mapped public key name from env file')
  ct.equal(selectStub.callCount, 0, 'does not prompt before first api request')
  ct.same(PostArmorPullStub.firstCall && PostArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'sends public key without team first')
  ct.same(upsertStub.firstCall && upsertStub.firstCall.args, ['DOTENV_PRIVATE_KEY_PRODUCTION', 'priv-from-api'], 'upserts mapped private key name into .env.keys')
  ct.same(result, {
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    changed: true,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local write metadata')
})

t.test('ArmorPull returns unchanged when .env.keys already has the private key', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const upsertStub = sandbox.stub().returns({ changed: false })
  const runStub = sandbox.stub().resolves({
    public_key: 'pub-from-api',
    private_key: 'priv-from-api'
  })
  const PostArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: sandbox.stub() },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(upsertStub.callCount, 1, 'attempts local upsert when private_key is present')
  ct.equal(result.changed, false, 'returns unchanged when upsert makes no file changes')
})

t.test('ArmorPull sends explicit team without prompt or retry', async (ct) => {
  const sandbox = sinon.createSandbox()
  const getStub = sandbox.stub().returns('pub-from-env')
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const runStub = sandbox.stub().resolves({
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    team: 'hackclub'
  })
  const upsertStub = sandbox.stub().returns({ changed: true })
  const PostArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env.production', 'hackclub').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when team is provided')
  ct.equal(PostArmorPullStub.callCount, 1, 'posts armor pull once')
  ct.same(PostArmorPullStub.firstCall && PostArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'hackclub'], 'sends explicit team on first request')
  ct.same(result, {
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    team: 'hackclub',
    changed: true,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns api json plus local write metadata')
})

t.test('ArmorPull prompts for team and retries when api requires team', async (ct) => {
  const sandbox = sinon.createSandbox()
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor pull')
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
  const runStub = sandbox.stub()
  runStub.onFirstCall().rejects(requiredError)
  runStub.onSecondCall().resolves({
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    team: 'hackclub'
  })
  const upsertStub = sandbox.stub().returns({ changed: true })
  const PostArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: getStub },
    promptsExport: { select: selectStub },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.same(PostArmorPullStub.firstCall && PostArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'tries without team first')
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
  ct.same(PostArmorPullStub.secondCall && PostArmorPullStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'hackclub'], 'retries with selected team')
  ct.equal(PostArmorPullStub.callCount, 2, 'only retries once')
  ct.same(upsertStub.firstCall && upsertStub.firstCall.args, ['DOTENV_PRIVATE_KEY', 'priv-from-api'], 'upserts private key after retry succeeds')
  ct.same(result, {
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    team: 'hackclub',
    changed: true,
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKeyValue: 'priv-from-api',
    publicKeyValue: 'pub-from-env'
  }, 'returns retry response plus local write metadata')
})

t.test('ArmorPull uses only team from required error meta without prompting', async (ct) => {
  const sandbox = sinon.createSandbox()
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team for armor pull')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [{ provider_slug: 'dotenvx' }]
  }
  const selectStub = sandbox.stub().resolves('should-not-be-used')
  const runStub = sandbox.stub()
  runStub.onFirstCall().rejects(requiredError)
  runStub.onSecondCall().resolves({
    public_key: 'pub-from-api',
    private_key: 'priv-from-api',
    team: 'dotenvx'
  })
  const upsertStub = sandbox.stub().returns({ changed: true })
  const PostArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team }
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: sandbox.stub().returns('pub-from-env') },
    promptsExport: { select: selectStub },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: upsertStub
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run()

  ct.equal(selectStub.callCount, 0, 'does not prompt when error meta has one team')
  ct.same(PostArmorPullStub.firstCall && PostArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', undefined], 'tries without team first')
  ct.same(PostArmorPullStub.secondCall && PostArmorPullStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', 'pub-from-env', 'dotenvx'], 'retries with only returned team')
})

t.test('ArmorPull rethrows non-team-required api errors', async (ct) => {
  const sandbox = sinon.createSandbox()
  const expectedError = new Error('boom')
  expectedError.code = 'UNAUTHORIZED'
  const PostArmorPullStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(expectedError)
  })
  const restore = loadArmorPullWithStubs({
    dotenvxExport: { get: sandbox.stub().returns('pub-from-env') },
    promptsExport: { select: sandbox.stub() },
    postArmorPullExport: PostArmorPullStub,
    upsertEnvKeyExport: sandbox.stub()
  })
  const ArmorPull = require(armorPullPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await ct.rejects(new ArmorPull('https://armor.dotenvx.com', 'token-1', 'device-pub-1', '.env').run(), expectedError)
})
