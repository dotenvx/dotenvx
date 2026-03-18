const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('provision builds env and keys for first-time setup', (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrc = sinon.stub().returns({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_123\n',
    envKeysFilepath: path.join('apps', 'backend', '.env.keys')
  })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './deriveKeypair': () => ({ publicKey: 'pub_123', privateKey: 'priv_123' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'backend', 'services', 'api', '.env')
  const keysFilepath = path.join('apps', 'backend', '.env.keys')
  const out = provision({ envSrc: '#!/usr/bin/env node\nHELLO=world', envFilepath, keysFilepath })

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

  ct.end()
})

t.test('provision appends to existing keys file', (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const keysSrc = 'EXISTING_KEYS\n# .env\nDOTENV_PRIVATE_KEY=priv_abc\n'
  const mutateKeysSrc = sinon.stub().returns({
    keysSrc,
    envKeysFilepath: path.join('apps', '.env.keys')
  })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './deriveKeypair': () => ({ publicKey: 'pub_abc', privateKey: 'priv_abc' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const keysFilepath = path.join('apps', '.env.keys')
  const out = provision({ envSrc: 'HELLO=world', envFilepath: path.join('apps', 'api', '.env'), keysFilepath })

  ct.equal(out.keysSrc, keysSrc)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateKeysSrc.callCount, 1)
  ct.equal(mutateKeysSrc.firstCall.args[0].keysFilepath, keysFilepath)
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyValue, 'priv_abc')
  ct.end()
})

t.test('provision defaults keys filepath when omitted', (ct) => {
  const mutateSrc = sinon.stub().returns({ envSrc: 'PUBLIC_BLOCK\nHELLO=world' })
  const mutateKeysSrc = sinon.stub().returns({
    keysSrc: '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/\n# .env\nDOTENV_PRIVATE_KEY=priv_x\n',
    envKeysFilepath: path.join('apps', 'api', '.env.keys')
  })

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './mutateSrc': mutateSrc,
    './mutateKeysSrc': mutateKeysSrc,
    './deriveKeypair': () => ({ publicKey: 'pub_x', privateKey: 'priv_x' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = provision({ envSrc: 'HELLO=world', envFilepath })

  ct.equal(out.envKeysFilepath, path.join('apps', 'api', '.env.keys'))
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(mutateSrc.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrc.callCount, 1)
  ct.equal(mutateKeysSrc.firstCall.args[0].keysFilepath, undefined)
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyName, 'DOTENV_PRIVATE_KEY')
  ct.equal(mutateKeysSrc.firstCall.args[0].privateKeyValue, 'priv_x')
  ct.end()
})
