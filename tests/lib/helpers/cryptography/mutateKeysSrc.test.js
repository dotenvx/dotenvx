const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('mutateKeysSrc initializes keys file when missing', async (ct) => {
  const exists = sinon.stub().resolves(false)
  const readFileX = sinon.stub()
  const writeFileX = sinon.stub().resolves()

  const mutateKeysSrc = proxyquire('../../../../src/lib/helpers/cryptography/mutateKeysSrc', {
    './../fsx': { exists, readFileX, writeFileX }
  })

  const envFilepath = path.join('apps', 'backend', '.env')
  const out = await mutateKeysSrc({
    envFilepath,
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKeyValue: 'priv_123'
  })

  ct.equal(out.envKeysFilepath, path.join('apps', 'backend', '.env.keys'))
  ct.match(out.keysSrc, '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/')
  ct.match(out.keysSrc, '# .env\nDOTENV_PRIVATE_KEY=priv_123')
  ct.equal(exists.callCount, 1)
  ct.equal(readFileX.callCount, 0)
  ct.equal(writeFileX.callCount, 1)
  ct.equal(writeFileX.firstCall.args[0], path.resolve(path.join('apps', 'backend', '.env.keys')))

  ct.end()
})

t.test('mutateKeysSrc appends to existing keys file and respects custom keys path', async (ct) => {
  const exists = sinon.stub().resolves(true)
  const readFileX = sinon.stub().resolves('EXISTING\n')
  const writeFileX = sinon.stub().resolves()

  const mutateKeysSrc = proxyquire('../../../../src/lib/helpers/cryptography/mutateKeysSrc', {
    './../fsx': { exists, readFileX, writeFileX }
  })

  const envFilepath = path.join('apps', 'frontend', '.env.production')
  const keysFilepath = path.join('custom', '.env.keys')
  const out = await mutateKeysSrc({
    envFilepath,
    keysFilepath,
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    privateKeyValue: 'priv_999'
  })

  ct.equal(out.envKeysFilepath, keysFilepath)
  ct.match(out.keysSrc, 'EXISTING')
  ct.match(out.keysSrc, '# .env.production\nDOTENV_PRIVATE_KEY_PRODUCTION=priv_999')
  ct.equal(exists.callCount, 1)
  ct.equal(readFileX.callCount, 1)
  ct.equal(readFileX.firstCall.args[0], path.resolve(keysFilepath))
  ct.equal(writeFileX.callCount, 1)
  ct.equal(writeFileX.firstCall.args[0], path.resolve(keysFilepath))

  ct.end()
})
