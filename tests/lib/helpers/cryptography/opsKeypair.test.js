const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('opsKeypair returns normalized keys from Ops keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_123',
    private_key: 'ops_priv_123'
  })

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  const out = await opsKeypair()

  ct.equal(out.publicKey, 'ops_pub_123')
  ct.equal(out.privateKey, 'ops_priv_123')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args.length, 1)
  ct.equal(keypair.firstCall.args[0], undefined)
  ct.end()
})

t.test('opsKeypair forwards provided public key to Ops keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  const out = await opsKeypair('existing_pub')

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.equal(keypair.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('opsKeypair forwards token to Ops keypair', async (ct) => {
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  const out = await opsKeypair(undefined, { token: 'token-123' })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args, [undefined, { token: 'token-123' }])
  ct.end()
})

t.test('opsKeypair forwards stderr hook to Ops keypair', async (ct) => {
  const hooks = {
    onStderr: sinon.stub()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  const out = await opsKeypair(undefined, { hooks })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(hooks.onStderr.callCount, 0)
  ct.same(keypair.firstCall.args, [undefined, { onStderr: hooks.onStderr, noSpinner: true }])
  ct.end()
})

t.test('opsKeypair brackets Ops keypair with spinner hooks', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().resolves({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
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

t.test('opsKeypair runs after hook when Ops keypair fails', async (ct) => {
  const hooks = {
    before: sinon.stub().resolves(),
    after: sinon.stub().resolves()
  }
  const keypair = sinon.stub().rejects(new Error('ops failed'))

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  await ct.rejects(opsKeypair('existing_pub', { hooks }), /ops failed/)

  ct.equal(hooks.before.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.equal(hooks.after.callCount, 1)
  ct.end()
})
