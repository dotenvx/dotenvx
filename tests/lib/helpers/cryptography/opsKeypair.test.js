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
  const beforeOpsKeypairStderr = sinon.stub()
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

  const out = await opsKeypair(undefined, { beforeOpsKeypairStderr })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(beforeOpsKeypairStderr.callCount, 0)
  ct.same(keypair.firstCall.args, [undefined, { beforeStderr: beforeOpsKeypairStderr, noSpinner: true }])
  ct.end()
})

t.test('opsKeypair brackets Ops keypair with spinner hooks', async (ct) => {
  const beforeOpsKeypair = sinon.stub().resolves()
  const afterOpsKeypair = sinon.stub().resolves()
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

  const out = await opsKeypair('existing_pub', { beforeOpsKeypair, afterOpsKeypair })

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(beforeOpsKeypair.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.same(keypair.firstCall.args[1], { noSpinner: true })
  ct.equal(afterOpsKeypair.callCount, 1)
  ct.ok(beforeOpsKeypair.calledBefore(keypair))
  ct.ok(afterOpsKeypair.calledAfter(keypair))
  ct.end()
})

t.test('opsKeypair runs after hook when Ops keypair fails', async (ct) => {
  const beforeOpsKeypair = sinon.stub().resolves()
  const afterOpsKeypair = sinon.stub().resolves()
  const keypair = sinon.stub().rejects(new Error('ops failed'))

  function OpsMock () {
    this.keypair = keypair
  }

  const opsKeypair = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypair', {
    './../../extensions/ops': OpsMock
  })

  await ct.rejects(opsKeypair('existing_pub', { beforeOpsKeypair, afterOpsKeypair }), /ops failed/)

  ct.equal(beforeOpsKeypair.callCount, 1)
  ct.equal(keypair.callCount, 1)
  ct.equal(afterOpsKeypair.callCount, 1)
  ct.end()
})
