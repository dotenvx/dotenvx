const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('opsKeypairSync returns normalized keys from Ops keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'ops_pub_123',
    private_key: 'ops_priv_123'
  })

  function OpsMock () {
    this.keypairSync = keypairSync
  }

  const opsKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypairSync', {
    './../../extensions/ops': OpsMock
  })

  const out = opsKeypairSync()

  ct.equal(out.publicKey, 'ops_pub_123')
  ct.equal(out.privateKey, 'ops_priv_123')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args.length, 1)
  ct.equal(keypairSync.firstCall.args[0], undefined)
  ct.end()
})

t.test('opsKeypairSync forwards provided public key to Ops keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'ops_pub_abc',
    private_key: 'ops_priv_abc'
  })

  function OpsMock () {
    this.keypairSync = keypairSync
  }

  const opsKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/opsKeypairSync', {
    './../../extensions/ops': OpsMock
  })

  const out = opsKeypairSync('existing_pub')

  ct.equal(out.publicKey, 'ops_pub_abc')
  ct.equal(out.privateKey, 'ops_priv_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args[0], 'existing_pub')
  ct.end()
})
