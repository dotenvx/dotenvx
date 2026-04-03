const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('provision builds env and keys for first-time setup', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrc = sinon.stub().resolves({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_123\n',
    envKeysFilepath: path.join('apps', 'backend', '.env.keys')
  })
  const opsKeypair = sinon.stub().resolves({ publicKey: 'ops_pub_unused', privateKey: 'ops_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_123', privateKey: 'priv_123' })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './localKeypair': localKeypair,
    './opsKeypair': opsKeypair,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'backend', 'services', 'api', '.env')
  const keysFilepath = path.join('apps', 'backend', '.env.keys')
  const out = await provision({ envSrc: '#!/usr/bin/env node\nHELLO=world', envFilepath, keysFilepath })

  ct.equal(out.envSrc, '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world')
  ct.match(out.keysSrc, '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/')
  ct.match(out.keysSrc, '# .env\nDOTENV_PRIVATE_KEY=priv_123')
  ct.equal(out.publicKey, 'pub_123')
  ct.equal(out.privateKey, 'priv_123')
  ct.equal(out.privateKeyAdded, true)
  ct.equal(out.envKeysFilepath, keysFilepath)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateSrc.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateSrc.firstCall.args[0].publicKeyName, 'DOTENV_PUBLIC_KEY')
  ct.equal(mutateSrc.firstCall.args[0].publicKeyValue, 'pub_123')
  ct.equal(mutateKeysSrc.callCount, 1)
  ct.equal(mutateKeysSrc.firstCall.args[0].envFilepath, envFilepath)
  ct.equal(mutateKeysSrc.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyValue, 'priv_123')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(opsKeypair.callCount, 0)

  ct.end()
})

t.test('provision appends to existing keys file', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const keysSrc = 'EXISTING_KEYS\n# .env\nDOTENV_PRIVATE_KEY=priv_abc\n'
  const mutateKeysSrc = sinon.stub().resolves({
    keysSrc,
    envKeysFilepath: path.join('apps', '.env.keys')
  })
  const opsKeypair = sinon.stub().resolves({ publicKey: 'ops_pub_unused', privateKey: 'ops_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_abc', privateKey: 'priv_abc' })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './localKeypair': localKeypair,
    './opsKeypair': opsKeypair,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const keysFilepath = path.join('apps', '.env.keys')
  const out = await provision({ envSrc: 'HELLO=world', envFilepath: path.join('apps', 'api', '.env'), keysFilepath })

  ct.equal(out.keysSrc, keysSrc)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateKeysSrc.callCount, 1)
  ct.equal(mutateKeysSrc.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyValue, 'priv_abc')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(opsKeypair.callCount, 0)
  ct.end()
})

t.test('provision defaults keys filepath when omitted', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrc = sinon.stub().resolves({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_x\n',
    envKeysFilepath: path.join('apps', 'api', '.env.keys')
  })
  const opsKeypair = sinon.stub().resolves({ publicKey: 'ops_pub_unused', privateKey: 'ops_priv_unused' })
  const localKeypair = sinon.stub().returns({ publicKey: 'pub_x', privateKey: 'priv_x' })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './localKeypair': localKeypair,
    './opsKeypair': opsKeypair,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = await provision({ envSrc: 'HELLO=world', envFilepath })

  ct.equal(out.envKeysFilepath, path.join('apps', 'api', '.env.keys'))
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateSrc.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrc.callCount, 1)
  ct.equal(mutateKeysSrc.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyValue, 'priv_x')
  ct.equal(localKeypair.callCount, 1)
  ct.equal(opsKeypair.callCount, 0)
  ct.end()
})

t.test('provision uses Ops keypair when opsOn is true', async (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrc = sinon.stub().resolves({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=ops_priv\n',
    envKeysFilepath: path.join('apps', 'api', '.env.keys')
  })
  const opsKeypair = sinon.stub().resolves({ publicKey: 'ops_pub', privateKey: 'ops_priv' })
  const localKeypair = sinon.stub().returns({ publicKey: 'local_pub_unused', privateKey: 'local_priv_unused' })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './localKeypair': localKeypair,
    './opsKeypair': opsKeypair,
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = await provision({ envSrc: 'HELLO=world', envFilepath, opsOn: true })

  ct.equal(out.publicKey, 'ops_pub')
  ct.equal(out.privateKey, 'ops_priv')
  ct.equal(opsKeypair.callCount, 1)
  ct.equal(localKeypair.callCount, 0)
  ct.equal(mutateSrc.firstCall.args[0].publicKeyValue, 'ops_pub')
  ct.equal(mutateKeysSrc.callCount, 0)
  ct.equal(out.privateKeyAdded, false)
  ct.equal(out.keysSrc, undefined)
  ct.equal(out.envKeysFilepath, undefined)
  ct.end()
})
