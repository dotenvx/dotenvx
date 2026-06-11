const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('armorKeypairSync returns normalized keys from Armor keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'armor_pub_123',
    private_key: 'armor_priv_123'
  })

  function ArmorMock () {
    this.keypairSync = keypairSync
  }

  const armorKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypairSync', {
    './../../extensions/armor': ArmorMock
  })

  const out = armorKeypairSync()

  ct.equal(out.publicKey, 'armor_pub_123')
  ct.equal(out.privateKey, 'armor_priv_123')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args.length, 2)
  ct.equal(keypairSync.firstCall.args[0], undefined)
  ct.end()
})

t.test('armorKeypairSync forwards provided public key to Armor keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypairSync = keypairSync
  }

  const armorKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypairSync', {
    './../../extensions/armor': ArmorMock
  })

  const out = armorKeypairSync('existing_pub')

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(out.privateKey, 'armor_priv_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('armorKeypairSync forwards options to Armor keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypairSync = keypairSync
  }

  const armorKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypairSync', {
    './../../extensions/armor': ArmorMock
  })

  const out = armorKeypairSync('existing_pub', { noSpinner: true })

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.same(keypairSync.firstCall.args, ['existing_pub', { noSpinner: true }])
  ct.end()
})

t.test('armorKeypairSync forwards command to Armor keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'armor_pub_abc',
    private_key: 'armor_priv_abc'
  })

  function ArmorMock () {
    this.keypairSync = keypairSync
  }

  const armorKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypairSync', {
    './../../extensions/armor': ArmorMock
  })

  const out = armorKeypairSync('existing_pub', { command: ['bin/rails', 's'] })

  ct.equal(out.publicKey, 'armor_pub_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.same(keypairSync.firstCall.args, ['existing_pub', { command: ['bin/rails', 's'] }])
  ct.end()
})
