const t = require('tap')
const sinon = require('sinon')
const Ops = require('../../../src/lib/services/ops')
const { findPrivateKey } = require('../../../src/lib/helpers/findPrivateKey')

t.beforeEach(() => {
  sinon.restore()
})

t.afterEach(() => {
  delete process.env.DOTENV_PRIVATE_KEY
})

t.test('#findPrivateKey', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#findPrivateKey non-standard .env name (secrets.txt)', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/secrets.txt'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#findPrivateKey non-standard .env name with no matching private key (secrets.ci.txt)', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/secrets.ci.txt'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, null)

  ct.end()
})

t.test('#findPrivateKey uses ops lookup with provided publicKey when opsOn', ct => {
  const stub = sinon.stub(Ops.prototype, 'keypair').returns('remote-private')

  const envFilepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = findPrivateKey(envFilepath, null, true, 'pub')

  t.equal(privateKey, 'remote-private')
  t.ok(stub.calledOnceWith('pub'), 'Ops.keypair called with public key')

  ct.end()
})

t.test('#findPrivateKey prefers process.env private key before ops lookup', ct => {
  process.env.DOTENV_PRIVATE_KEY = 'process-env-private'
  const stub = sinon.stub(Ops.prototype, 'keypair')

  const envFilepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = findPrivateKey(envFilepath, null, true, 'pub')

  t.equal(privateKey, 'process-env-private')
  t.ok(stub.notCalled, 'Ops.keypair not called when process.env key present')

  ct.end()
})

t.test('#findPrivateKey falls back to local when ops lookup fails', ct => {
  const stub = sinon.stub(Ops.prototype, 'keypair').returns(null)

  const envFilepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = findPrivateKey(envFilepath, null, true, 'pub')

  t.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  t.ok(stub.calledOnceWith('pub'), 'Ops keypair attempted once')

  ct.end()
})
