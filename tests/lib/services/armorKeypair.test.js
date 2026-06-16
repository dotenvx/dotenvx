const t = require('tap')
const sinon = require('sinon')

const promptsPath = require.resolve('../../../src/lib/helpers/prompts')
const postKeypairPath = require.resolve('../../../src/lib/api/postKeypair')
const keypairMetadataPath = require.resolve('../../../src/lib/helpers/keypairMetadata')
const armorKeypairPath = require.resolve('../../../src/lib/services/armorKeypair')

function loadArmorKeypairWithStubs ({ promptsExport, postKeypairExport, keypairMetadataExport }) {
  const originalPrompts = require(promptsPath)
  const originalPostKeypair = require(postKeypairPath)
  const originalKeypairMetadata = require(keypairMetadataPath)

  require.cache[promptsPath].exports = promptsExport || { select: async () => 'dotenvx' }
  require.cache[postKeypairPath].exports = postKeypairExport
  require.cache[keypairMetadataPath].exports = keypairMetadataExport || (() => ({ filepath: '.env' }))
  delete require.cache[armorKeypairPath]
  require(armorKeypairPath)

  return () => {
    require.cache[promptsPath].exports = originalPrompts
    require.cache[postKeypairPath].exports = originalPostKeypair
    require.cache[keypairMetadataPath].exports = originalKeypairMetadata
    delete require.cache[armorKeypairPath]
  }
}

t.test('ArmorKeypair builds metadata from explicit env file and json metadata', async (ct) => {
  const sandbox = sinon.createSandbox()
  const metadataStub = sandbox.stub().returns({
    filepath: 'apps/api/.env.production',
    filename: '.env.production',
    environment: 'production',
    command: 'dotenvx run -f .env.production -- npm start'
  })
  const runStub = sandbox.stub().resolves({
    public_key: 'generated-public-key',
    private_key: 'generated-private-key'
  })
  const PostKeypairStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team, metadata) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, team, metadata }
  })
  const restore = loadArmorKeypairWithStubs({
    postKeypairExport: PostKeypairStub,
    keypairMetadataExport: metadataStub
  })
  const ArmorKeypair = require(armorKeypairPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  await new ArmorKeypair('https://armor.dotenvx.com', 'token-1', 'device-pub-1', undefined, {
    envFile: 'apps/api/.env.production',
    metadata: '{"command":"dotenvx run -f .env.production -- npm start"}'
  }).run()

  ct.same(metadataStub.firstCall && metadataStub.firstCall.args, ['apps/api/.env.production', '{"command":"dotenvx run -f .env.production -- npm start"}'], 'builds metadata from env file and json metadata')
  ct.same(PostKeypairStub.firstCall && PostKeypairStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', undefined, undefined, {
    filepath: 'apps/api/.env.production',
    filename: '.env.production',
    environment: 'production',
    command: 'dotenvx run -f .env.production -- npm start'
  }], 'sends metadata on keypair request')
})

t.test('ArmorKeypair prompts for team and retries when api requires team', async (ct) => {
  const sandbox = sinon.createSandbox()
  const selectStub = sandbox.stub().resolves('hackclub')
  const requiredError = new Error('[DOTENVX_TEAM_REQUIRED] choose a team')
  requiredError.code = 'DOTENVX_TEAM_REQUIRED'
  requiredError.meta = {
    organizations: [
      { provider_slug: 'dotenvx' },
      { provider_slug: 'hackclub' }
    ]
  }
  const firstRunStub = sandbox.stub().rejects(requiredError)
  const secondRunStub = sandbox.stub().resolves({
    public_key: 'generated-public-key',
    private_key: 'generated-private-key'
  })
  const PostKeypairStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team, metadata) {
    this.run = PostKeypairStub.callCount === 1 ? firstRunStub : secondRunStub
    this.args = { hostname, token, devicePublicKey, publicKey, team, metadata }
  })
  const restore = loadArmorKeypairWithStubs({
    promptsExport: { select: selectStub },
    postKeypairExport: PostKeypairStub
  })
  const ArmorKeypair = require(armorKeypairPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const result = await new ArmorKeypair('https://armor.dotenvx.com', 'token-1', 'device-pub-1', undefined).run()

  ct.equal(PostKeypairStub.callCount, 2, 'posts keypair twice')
  ct.same(PostKeypairStub.firstCall && PostKeypairStub.firstCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', undefined, undefined, { filepath: '.env' }], 'first tries without team')
  ct.same(selectStub.firstCall && selectStub.firstCall.args, [{
    message: 'Select team',
    choices: [
      { name: 'dotenvx', value: 'dotenvx' },
      { name: 'hackclub', value: 'hackclub' }
    ]
  }, {
    input: process.stdin,
    output: process.stderr
  }], 'prompts with organization provider slugs from error meta on stderr')
  ct.same(PostKeypairStub.secondCall && PostKeypairStub.secondCall.args, ['https://armor.dotenvx.com', 'token-1', 'device-pub-1', undefined, 'hackclub', { filepath: '.env' }], 'retries with selected team')
  ct.same(result, {
    public_key: 'generated-public-key',
    private_key: 'generated-private-key'
  }, 'returns retry response')
})

t.test('ArmorKeypair polls with grant when access approval is required', async (ct) => {
  const sandbox = sinon.createSandbox()
  const clock = sandbox.useFakeTimers()
  const onApprovalRequiredStub = sandbox.stub()
  const requiredError = new Error('[ACCESS_APPROVAL_REQUIRED] approval required')
  requiredError.code = 'ACCESS_APPROVAL_REQUIRED'
  requiredError.meta = {
    grant_token: 'grant-token-123',
    approval_uri: 'https://armor.dotenvx.com/grants/grant-token-123'
  }
  const pendingError = new Error('[ACCESS_PENDING] approval pending')
  pendingError.code = 'ACCESS_PENDING'
  const approvalPendingError = new Error('[ACCESS_APPROVAL_PENDING] approval pending')
  approvalPendingError.code = 'ACCESS_APPROVAL_PENDING'
  const approvedResponse = {
    public_key: 'generated-public-key',
    private_key: 'generated-private-key'
  }
  const runStubs = [
    sandbox.stub().rejects(requiredError),
    sandbox.stub().rejects(pendingError),
    sandbox.stub().rejects(approvalPendingError),
    sandbox.stub().resolves(approvedResponse)
  ]
  const PostKeypairStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, team, metadata, grantToken) {
    this.run = runStubs[PostKeypairStub.callCount - 1]
    this.args = { hostname, token, devicePublicKey, publicKey, team, metadata, grantToken }
  })
  const restore = loadArmorKeypairWithStubs({
    promptsExport: { select: sandbox.stub() },
    postKeypairExport: PostKeypairStub
  })
  const ArmorKeypair = require(armorKeypairPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  const keypair = new ArmorKeypair('https://armor.example.com/', 'token-1', 'device-pub-1', 'existing-public-key')
  keypair.onApprovalRequired = onApprovalRequiredStub
  const promise = keypair.run()

  await Promise.resolve()
  await Promise.resolve()

  ct.equal(PostKeypairStub.callCount, 2, 'posts initial request and first poll request')
  ct.same(onApprovalRequiredStub.firstCall && onApprovalRequiredStub.firstCall.args, [{ approvalUri: 'https://armor.dotenvx.com/grants/grant-token-123', code: 'ACCESS_APPROVAL_REQUIRED' }], 'notifies with approval uri and code from api error')
  ct.same(PostKeypairStub.firstCall && PostKeypairStub.firstCall.args, ['https://armor.example.com/', 'token-1', 'device-pub-1', 'existing-public-key', undefined, { filepath: '.env' }], 'first request has no grant')
  ct.same(PostKeypairStub.secondCall && PostKeypairStub.secondCall.args, ['https://armor.example.com/', 'token-1', 'device-pub-1', 'existing-public-key', undefined, { filepath: '.env' }, 'grant-token-123'], 'poll request includes grant')

  await clock.tickAsync(1000)
  await clock.tickAsync(1000)
  const result = await promise

  ct.equal(PostKeypairStub.callCount, 4, 'polls until api succeeds')
  ct.same(result, approvedResponse, 'returns approved keypair response')
})
