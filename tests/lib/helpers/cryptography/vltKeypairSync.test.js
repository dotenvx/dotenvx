const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('vltKeypairSync returns normalized keys from Vlt keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'vlt_pub_123',
    private_key: 'vlt_priv_123'
  })

  function VltMock () {
    this.keypairSync = keypairSync
  }

  const vltKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/vltKeypairSync', {
    './../../extensions/vlt': VltMock
  })

  const out = vltKeypairSync()

  ct.equal(out.publicKey, 'vlt_pub_123')
  ct.equal(out.privateKey, 'vlt_priv_123')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args.length, 2)
  ct.equal(keypairSync.firstCall.args[0], undefined)
  ct.end()
})

t.test('vltKeypairSync forwards provided public key to Vlt keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function VltMock () {
    this.keypairSync = keypairSync
  }

  const vltKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/vltKeypairSync', {
    './../../extensions/vlt': VltMock
  })

  const out = vltKeypairSync('existing_pub')

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(out.privateKey, 'vlt_priv_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.equal(keypairSync.firstCall.args[0], 'existing_pub')
  ct.end()
})

t.test('vltKeypairSync forwards options to Vlt keypair', async (ct) => {
  const keypairSync = sinon.stub().returns({
    public_key: 'vlt_pub_abc',
    private_key: 'vlt_priv_abc'
  })

  function VltMock () {
    this.keypairSync = keypairSync
  }

  const vltKeypairSync = proxyquire('../../../../src/lib/helpers/cryptography/vltKeypairSync', {
    './../../extensions/vlt': VltMock
  })

  const out = vltKeypairSync('existing_pub', { noSpinner: true })

  ct.equal(out.publicKey, 'vlt_pub_abc')
  ct.equal(keypairSync.callCount, 1)
  ct.same(keypairSync.firstCall.args, ['existing_pub', { noSpinner: true }])
  ct.end()
})
