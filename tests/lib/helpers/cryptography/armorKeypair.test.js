const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('armorKeypair returns normalized keys from Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_123',
    private_key: 'vlt_priv_123'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair()

  ct.equal(out.publicKey, 'vlt_pub_123')
  ct.equal(out.privateKey, 'vlt_priv_123')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args.length, 2)
  ct.equal(keypair.firstCall.args[0], undefined)
  ct.end()
})

t.test('armorKeypair forwards provided public key to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair('existing_pub')

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(out.privateKey, 'vlt_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('armorKeypair forwards token to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair(undefined, { token: 'token-123' })

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(out.privateKey, 'vlt_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { token: 'token-123' }])
  ct.end()
})

t.test('armorKeypair forwards env filepath to Armor keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair(undefined, { envFilepath: '.env.production' })

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(out.privateKey, 'vlt_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { envFilepath: '.env.production' }])
  ct.end()
})

t.test('armorKeypair forwards stderr hook to Armor keypair', async (ct) => {
  const hooks = {
    onStderr: sinon.stub()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair(undefined, { hooks })

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(out.privateKey, 'vlt_priv_abc')
  ct.equal(hooks.onStderr.callCount, 0)
  ct.same(keypair.firstCall.args, [undefined, { onStderr: hooks.onStderr, noSpinner: true }])
  ct.end()
})

t.test('armorKeypair brackets Armor keypair with spinner hooks', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  const out = await armorKeypair('existing_pub', { hooks })

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(hooks.before.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args[1], { noSpinner: true })
  ct.equal(hooks.after.callCount, 1)
  ct.ok(hooks.before.calledBefore(keypair))
  ct.ok(hooks.after.calledAfter(keypair))
  ct.end()
})

t.test('armorKeypair runs after hook when Armor keypair fails', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().rejects(new Error('vlt failed'))

  function ArmorMock () {
    this.keypair = keypair
  }

  const armorKeypair = proxyquire('../../../../src/lib/helpers/cryptography/armorKeypair', {
    './../../extensions/armor': ArmorMock
  })

  await ct.rejects(armorKeypair('existing_pub', { hooks }), /vlt failed/)

  ct.equal(hooks.before.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.equal(hooks.after.callCount, 1)
  ct.end()
})
