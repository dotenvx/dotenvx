const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('opsKeypair returns normalized keys from Vlt keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_123',
    private_key: 'ops_priv_123'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair()

  ct.equal(out.publicKey, 'ops_pub_123')
  ct.equal(out.privateKey, 'ops_priv_123')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args.length, 2)
  ct.equal(keypair.firstCall.args[0], undefined)
  ct.end()
})

t.test('opsKeypair forwards provided public key to Vlt keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair('existing_pub')

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('opsKeypair forwards token to Vlt keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair(undefined, { token: 'token-123' })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { token: 'token-123' }])
  ct.end()
})

t.test('opsKeypair forwards env filepath to Vlt keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair(undefined, { envFilepath: '.env.production' })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { envFilepath: '.env.production' }])
  ct.end()
})

t.test('opsKeypair forwards stderr hook to Vlt keypair', async (ct) => {
  const hooks = {
    onStderr: sinon.stub()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair(undefined, { hooks })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(hooks.onStderr.callCount, 0)
  ct.same(keypair.firstCall.args, [undefined, { onStderr: hooks.onStderr, noSpinner: true }])
  ct.end()
})

t.test('opsKeypair brackets Vlt keypair with spinner hooks', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  const out = await opsKeypair('existing_pub', { hooks })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(hooks.before.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args[1], { noSpinner: true })
  ct.equal(hooks.after.callCount, 1)
  ct.ok(hooks.before.calledBefore(keypair))
  ct.ok(hooks.after.calledAfter(keypair))
  ct.end()
})

t.test('opsKeypair runs after hook when Vlt keypair fails', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().rejects(new Error('ops failed'))

  function VltMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/vlt': VltMock
  })

  await ct.rejects(opsKeypair('existing_pub', { hooks }), /ops failed/)

  ct.equal(hooks.before.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.equal(hooks.after.callCount, 1)
  ct.end()
})
