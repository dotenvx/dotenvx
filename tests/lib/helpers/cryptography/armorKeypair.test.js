const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('armorKeypair returns normalized keys from Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'armor_pub_123',
    private_key: 'armor_priv_123'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair()

  ct.equal(out.publicKey, 'armor_pub_123')
  ct.equal(out.privateKey, 'armor_priv_123')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args.length, 2)
  ct.equal(keypair.firstCall.args[0], undefined)
  ct.end()
})

t.test('armorKeypair forwards provided public key to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair('existing_pub')

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(out.privateKey, 'armor_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('armorKeypair forwards token to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair(undefined, { token: 'token-123' })

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(out.privateKey, 'armor_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { token: 'token-123' }])
  ct.end()
})

t.test('armorKeypair forwards env filepath to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair(undefined, { envFilepath: '.env.production' })

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(out.privateKey, 'armor_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { envFilepath: '.env.production' }])
  ct.end()
})
