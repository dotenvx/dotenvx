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
