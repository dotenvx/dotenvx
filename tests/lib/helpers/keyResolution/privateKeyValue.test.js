const t = require('tap')
const sinon = require('sinon')
const Ops = require('../../../../src/lib/services/ops')

const privateKeyValue = require('../../../../src/lib/helpers/keyResolution/privateKeyValue')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  sinon.restore()
})

let filepath = '.env'

t.test('#privateKeyValue', ct => {
  const result = privateKeyValue(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#privateKeyValue when process.env.DOTENV_PRIVATE_KEY is set', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  const result = privateKeyValue(filepath)

  ct.same(result, '<privateKey>')

  ct.end()
})

t.test('#privateKeyValue when process.env.DOTENV_PRIVATE_KEY is set but it is an empty string', ct => {
  process.env.DOTENV_PRIVATE_KEY = ''

  const result = privateKeyValue(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#privateKeyValue when .env.keys present', ct => {
  filepath = 'tests/monorepo/apps/encrypted/.env'

  const result = privateKeyValue(filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#privateKeyValue when .env.keys present but filename is not .env (use invertse of DOTENV_PUBLIC_KEY* in the filename (if exists))', ct => {
  filepath = 'tests/monorepo/apps/encrypted/secrets.txt'

  const result = privateKeyValue(filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#privateKeyValue when DOTENV_PRIVATE_KEY passed and custom filename', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  filepath = 'tests/monorepo/apps/encrypted/secrets.txt'

  const result = privateKeyValue(filepath)

  ct.same(result, '<privateKey>')

  ct.end()
})

t.test('#privateKeyValue when DOTENV_PRIVATE_KEY passed and custom filename but custom filename has a different named DOTENV_PUBLIC_KEY', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  filepath = 'tests/monorepo/apps/encrypted/secrets.ci.txt'

  const result = privateKeyValue(filepath)
  ct.same(result, null) // it should not find it because it is instead looking for a DOTENV_PRIVATE_KEY_CI (see secrets.ci.txt contents)

  // matching ci key is set - inverse of the ci public key in the secrets.ci.txt file
  process.env.DOTENV_PRIVATE_KEY_CI = '<privateKeyCi>'
  const result2 = privateKeyValue(filepath)
  ct.same(result2, '<privateKeyCi>')

  // an additional random key is set but still with the dotenv private key schema
  process.env.DOTENV_PRIVATE_KEY_PRODUCTION = '<privateKeyProduction>'
  const result3 = privateKeyValue(filepath)
  ct.same(result3, '<privateKeyCi>') // it should still find the CI one first

  ct.end()
})

t.test('#privateKeyValue uses ops lookup with provided publicKey when opsOn', ct => {
  const stub = sinon.stub(Ops.prototype, 'keypair').returns('remote-private')

  const filepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = privateKeyValue(filepath, null, true, 'pub')

  ct.equal(privateKey, 'remote-private')
  ct.ok(stub.calledOnceWith('pub'), 'Ops.keypair called with public key')

  ct.end()
})

t.test('#privateKeyValue prefers process.env private key before ops lookup', ct => {
  process.env.DOTENV_PRIVATE_KEY = 'process-env-private'
  const stub = sinon.stub(Ops.prototype, 'keypair')

  const filepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = privateKeyValue(filepath, null, true, 'pub')

  ct.equal(privateKey, 'process-env-private')
  ct.ok(stub.notCalled, 'Ops.keypair not called when process.env key present')

  ct.end()
})

t.test('#privateKeyValue falls back to local when ops lookup fails', ct => {
  const stub = sinon.stub(Ops.prototype, 'keypair').returns(null)

  const filepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = privateKeyValue(filepath, null, true, 'pub')

  ct.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  ct.ok(stub.calledOnceWith('pub'), 'Ops keypair attempted once')

  ct.end()
})
