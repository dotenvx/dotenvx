const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('provisionSync builds env and keys for first-time setup', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrcSync = sinon.stub().returns({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_123\n',
    envKeysFilepath: path.join('apps', 'backend', '.env.keys')
  })
  const vltKeypairSync = sinon.stub().returns({ publicKey: 'vlt_pub_unused', privateKey: 'vlt_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_123', privateKey: 'priv_123' })

  const provisionSync = proxyquire('../../../../src/lib/helpers/cryptography/provisionSync', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrcSync': mutateKeysSrcSync,
    './localKeypair': localKeypair,
    './vltKeypairSync': vltKeypairSync,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'backend', 'services', 'api', '.env')
  const keysFilepath = path.join('apps', 'backend', '.env.keys')
  const out = await provisionSync({ envSrc: '#!/usr/bin/env node\nHELLO=world', envFilepath, keysFilepath })

  ct.equal(out.envSrc, '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world')
  ct.match(out.keysSrc, '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/')
  ct.match(out.keysSrc, '# .env\nDOTENV_PRIVATE_KEY=priv_123')
  ct.equal(out.publicKey, 'pub_123')
  ct.equal(out.privateKey, 'priv_123')
  ct.equal(out.localPrivateKeyAdded, true)
  ct.equal(out.envKeysFilepath, keysFilepath)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateSrc.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateSrc.firstCall.args[0].publicKeyName, 'DOTENV_PUBLIC_KEY')
  ct.equal(mutateSrc.firstCall.args[0].publicKeyValue, 'pub_123')
  ct.equal(mutateKeysSrcSync.callCount, 1)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].envFilepath, envFilepath)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyValue, 'priv_123')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(vltKeypairSync.callCount, 0)

  ct.end()
})

t.test('provisionSync appends to existing keys file', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const keysSrc = 'EXISTING_KEYS\n# .env\nDOTENV_PRIVATE_KEY=priv_abc\n'
  const mutateKeysSrcSync = sinon.stub().returns({
    keysSrc,
    envKeysFilepath: path.join('apps', '.env.keys')
  })
  const vltKeypairSync = sinon.stub().returns({ publicKey: 'vlt_pub_unused', privateKey: 'vlt_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_abc', privateKey: 'priv_abc' })

  const provisionSync = proxyquire('../../../../src/lib/helpers/cryptography/provisionSync', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrcSync': mutateKeysSrcSync,
    './localKeypair': localKeypair,
    './vltKeypairSync': vltKeypairSync,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const keysFilepath = path.join('apps', '.env.keys')
  const out = await provisionSync({ envSrc: 'HELLO=world', envFilepath: path.join('apps', 'api', '.env'), keysFilepath })

  ct.equal(out.keysSrc, keysSrc)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateKeysSrcSync.callCount, 1)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyValue, 'priv_abc')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(vltKeypairSync.callCount, 0)
  ct.end()
})

t.test('provisionSync defaults keys filepath when omitted', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrcSync = sinon.stub().returns({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_x\n',
    envKeysFilepath: path.join('apps', 'api', '.env.keys')
  })
  const vltKeypairSync = sinon.stub().returns({ publicKey: 'vlt_pub_unused', privateKey: 'vlt_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_x', privateKey: 'priv_x' })

  const provisionSync = proxyquire('../../../../src/lib/helpers/cryptography/provisionSync', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrcSync': mutateKeysSrcSync,
    './localKeypair': localKeypair,
    './vltKeypairSync': vltKeypairSync,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = await provisionSync({ envSrc: 'HELLO=world', envFilepath })

  ct.equal(out.envKeysFilepath, path.join('apps', 'api', '.env.keys'))
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateSrc.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrcSync.callCount, 1)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrcSync.firstCall.args[0].privateKeyValue, 'priv_x')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(vltKeypairSync.callCount, 0)
  ct.end()
})

t.test('provisionSync uses Vlt keypair when noVlt is false', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrcSync = sinon.stub().returns({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=vlt_priv\n',
    envKeysFilepath: path.join('apps', 'api', '.env.keys')
  })
  const vltKeypairSync = sinon.stub().returns({ publicKey: 'vlt_pub', privateKey: 'vlt_priv' })
  const localKeypair = sinon.stub().returns({ publicKey: 'local_pub_unused', privateKey: 'local_priv_unused' })

  const provisionSync = proxyquire('../../../../src/lib/helpers/cryptography/provisionSync', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrcSync': mutateKeysSrcSync,
    './localKeypair': localKeypair,
    './vltKeypairSync': vltKeypairSync,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = await provisionSync({ envSrc: 'HELLO=world', envFilepath, noVlt: false })

  ct.equal(out.publicKey, 'vlt_pub')
  ct.equal(out.privateKey, 'vlt_priv')
  ct.equal(vltKeypairSync.callCount, 1)
  ct.same(vltKeypairSync.firstCall.args, [undefined, { envFilepath }])
  ct.equal(localKeypair.callCount, 0)
  ct.equal(mutateSrc.firstCall.args[0].publicKeyValue, 'vlt_pub')
  ct.equal(mutateKeysSrcSync.callCount, 0)
  ct.equal(out.localPrivateKeyAdded, false)
  ct.equal(out.keysSrc, undefined)
  ct.equal(out.envKeysFilepath, undefined)
  ct.end()
})
