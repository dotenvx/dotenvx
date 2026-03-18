const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('provision builds env and keys for first-time setup', (ct) => {
  const existsSync = sinon.stub().returns(false)
  const readFileX = sinon.stub().returns('')
  const writeFileX = sinon.stub()
  const mutateSrc = sinon.stub().returns('#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world')

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX, writeFileX },
    './mutateSrc': mutateSrc,
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
  ct.equal(existsSync.callCount, 1)
  ct.equal(readFileX.callCount, 0)
  ct.equal(writeFileX.callCount, 1)
  ct.equal(writeFileX.firstCall.args[0], path.resolve(keysFilepath))
  ct.equal(writeFileX.firstCall.args[1], out.keysSrc)

  ct.end()
})

t.test('provision appends to existing keys file', (ct) => {
  const existing = 'EXISTING_KEYS'
  const existsSync = sinon.stub().returns(true)
  const readFileX = sinon.stub().returns(existing)
  const writeFileX = sinon.stub()
  const mutateSrc = sinon.stub().returns('PUBLIC_BLOCK\nHELLO=world')

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX, writeFileX },
    './mutateSrc': mutateSrc,
    './deriveKeypair': () => ({ publicKey: 'pub_abc', privateKey: 'priv_abc' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const keysFilepath = path.join('apps', '.env.keys')
  const out = provision({ envSrc: 'HELLO=world', envFilepath: path.join('apps', 'api', '.env'), keysFilepath })

  ct.match(out.keysSrc, /^EXISTING_KEYS\n# .env\nDOTENV_PRIVATE_KEY=priv_abc/m)
  ct.equal(mutateSrc.callCount, 1)
  ct.equal(readFileX.callCount, 1)
  ct.equal(writeFileX.callCount, 1)
  ct.equal(writeFileX.firstCall.args[0], path.resolve(keysFilepath))
  ct.equal(writeFileX.firstCall.args[1], out.keysSrc)
  ct.end()
})

t.test('provision defaults keys filepath when omitted', (ct) => {
  const existsSync = sinon.stub().returns(false)
  const writeFileX = sinon.stub()
  const mutateSrc = sinon.stub().returns('PUBLIC_BLOCK\nHELLO=world')

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX: () => '', writeFileX },
    './mutateSrc': mutateSrc,
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
  ct.equal(writeFileX.callCount, 1)
  ct.equal(writeFileX.firstCall.args[0], path.resolve(path.join('apps', 'api', '.env.keys')))
  ct.equal(writeFileX.firstCall.args[1], out.keysSrc)
  ct.end()
})
