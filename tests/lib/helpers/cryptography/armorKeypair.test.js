const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

function loadArmorKeypair ({ SessionMock, ArmorKeypairStub }) {
  return proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../../db/session': SessionMock,
    './../../services/armorKeypair': ArmorKeypairStub
  })
}

t.test('armorKeypair returns normalized keys from native ArmorKeypair service', async (ct) => {
  const runStub = sinon.stub().resolves({
    public_key: 'armor_pub_123',
    private_key: 'armor_priv_123'
  })

  function SessionMock () {
    this.hostname = () => 'https://armor.example.com'
    this.token = () => 'token-from-session'
    this.devicePublicKey = () => 'device-pub'
  }

  const ArmorKeypairStub = sinon.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, options) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, options }
  })
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  const out = await armorKeypair()

  ct.same(out, {
    publicKey: 'armor_pub_123',
    privateKey: 'armor_priv_123'
  })
  ct.equal(ArmorKeypairStub.callCount, 1)
  ct.same(ArmorKeypairStub.firstCall.args, ['https://armor.example.com', 'token-from-session', 'device-pub', undefined, {
    envFile: undefined,
    metadata: undefined
  }])
})

t.test('armorKeypair forwards provided public key to native ArmorKeypair service', async (ct) => {
  const runStub = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function SessionMock () {
    this.hostname = () => 'https://armor.example.com'
    this.token = () => 'token-from-session'
    this.devicePublicKey = () => 'device-pub'
  }

  const ArmorKeypairStub = sinon.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, options) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, options }
  })
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  const out = await armorKeypair('existing_pub')

  ct.same(out, {
    publicKey: 'armor_pub_abc',
    privateKey: 'armor_priv_abc'
  })
  ct.same(ArmorKeypairStub.firstCall.args, ['https://armor.example.com', 'token-from-session', 'device-pub', 'existing_pub', {
    envFile: undefined,
    metadata: undefined
  }])
})

t.test('armorKeypair forwards explicit token and env filepath to native ArmorKeypair service', async (ct) => {
  const runStub = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function SessionMock () {
    this.hostname = () => 'https://armor.example.com'
    this.token = () => 'token-from-session'
    this.devicePublicKey = () => 'device-pub'
  }

  const ArmorKeypairStub = sinon.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, options) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, options }
  })
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  await armorKeypair(undefined, {
    token: 'token-123',
    envFilepath: '.env.production'
  })

  ct.same(ArmorKeypairStub.firstCall.args, ['https://armor.example.com', 'token-123', 'device-pub', undefined, {
    envFile: '.env.production',
    metadata: undefined
  }])
})

t.test('armorKeypair forwards command as metadata json to native ArmorKeypair service', async (ct) => {
  const runStub = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function SessionMock () {
    this.hostname = () => 'https://armor.example.com'
    this.token = () => 'token-from-session'
    this.devicePublicKey = () => 'device-pub'
  }

  const ArmorKeypairStub = sinon.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, options) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, options }
  })
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  await armorKeypair('existing_pub', {
    envFilepath: '.env.production',
    command: ['dotenvx', 'keypair', '--token', 'token-123', '-f', '.env.production']
  })

  ct.same(ArmorKeypairStub.firstCall.args, ['https://armor.example.com', 'token-from-session', 'device-pub', 'existing_pub', {
    envFile: '.env.production',
    metadata: '{"command":"dotenvx keypair --token [REDACTED] -f .env.production"}'
  }])
})

t.test('armorKeypair forwards string command as metadata json', async (ct) => {
  const runStub = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function SessionMock () {
    this.hostname = () => 'https://armor.example.com'
    this.token = () => 'token-from-session'
    this.devicePublicKey = () => 'device-pub'
  }

  const ArmorKeypairStub = sinon.stub().callsFake(function (hostname, token, devicePublicKey, publicKey, options) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, publicKey, options }
  })
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  await armorKeypair('existing_pub', {
    command: 'dotenvx get HELLO -f .env.production'
  })

  ct.same(ArmorKeypairStub.firstCall.args[4], {
    envFile: undefined,
    metadata: '{"command":"dotenvx get HELLO -f .env.production"}'
  })
})

t.test('armorKeypair returns empty keys and does not create device key when native token is absent', async (ct) => {
  const devicePublicKey = sinon.stub()

  function SessionMock () {
    this.token = () => undefined
    this.devicePublicKey = devicePublicKey
  }

  const ArmorKeypairStub = sinon.stub()
  const armorKeypair = loadArmorKeypair({ SessionMock, ArmorKeypairStub })

  const out = await armorKeypair('existing_pub')

  ct.same(out, {
    publicKey: undefined,
    privateKey: undefined
  })
  ct.equal(devicePublicKey.callCount, 0, 'does not create device key without a token')
  ct.equal(ArmorKeypairStub.callCount, 0, 'does not call native api without a token')
})
