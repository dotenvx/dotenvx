const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('provision builds env and keys for first-time setup', (ct) => {
  const existsSync = sinon.stub().returns(false)
  const readFileX = sinon.stub().returns('')
  const prependPublicKey = sinon.stub().returns('PUBLIC_BLOCK')

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX },
    './../preserveShebang': () => ({ firstLinePreserved: '#!/usr/bin/env node\n', envSrc: 'HELLO=world' }),
    './../prependPublicKey': prependPublicKey,
    './deriveKeypair': () => ({ publicKey: 'pub_123', privateKey: 'priv_123' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'backend', 'services', 'api', '.env')
  const keysFilepath = path.join('apps', 'backend', '.env.keys')
  const out = provision({ src: '#!/usr/bin/env node\nHELLO=world', envFilepath, keysFilepath })

  ct.equal(out.envSrc, '#!/usr/bin/env node\nPUBLIC_BLOCK\nHELLO=world')
  ct.match(out.keysSrc, '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/')
  ct.match(out.keysSrc, '# .env\nDOTENV_PRIVATE_KEY=priv_123')
  ct.equal(out.publicKey, 'pub_123')
  ct.equal(out.privateKey, 'priv_123')
  ct.equal(out.privateKeyAdded, true)
  ct.equal(out.envKeysFilepath, keysFilepath)
  ct.equal(prependPublicKey.firstCall.args[3], '../../.env.keys')
  ct.equal(existsSync.callCount, 1)
  ct.equal(readFileX.callCount, 0)

  ct.end()
})

t.test('provision appends to existing keys file', (ct) => {
  const existing = 'EXISTING_KEYS'
  const existsSync = sinon.stub().returns(true)
  const readFileX = sinon.stub().returns(existing)

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX },
    './../preserveShebang': () => ({ firstLinePreserved: '', envSrc: 'HELLO=world' }),
    './../prependPublicKey': () => 'PUBLIC_BLOCK',
    './deriveKeypair': () => ({ publicKey: 'pub_abc', privateKey: 'priv_abc' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const keysFilepath = path.join('apps', '.env.keys')
  const out = provision({ src: 'HELLO=world', envFilepath: path.join('apps', 'api', '.env'), keysFilepath })

  ct.match(out.keysSrc, /^EXISTING_KEYS\n# .env\nDOTENV_PRIVATE_KEY=priv_abc/m)
  ct.equal(readFileX.callCount, 1)
  ct.end()
})

t.test('provision defaults keys filepath when omitted', (ct) => {
  const existsSync = sinon.stub().returns(false)

  const provision = proxyquire('../../../../src/lib/helpers/cryptography/provision', {
    './../fsx': { existsSync, readFileX: () => '' },
    './../preserveShebang': () => ({ firstLinePreserved: '', envSrc: 'HELLO=world' }),
    './../prependPublicKey': () => 'PUBLIC_BLOCK',
    './deriveKeypair': () => ({ publicKey: 'pub_x', privateKey: 'priv_x' }),
    '../keyResolution': {
      keyNames: () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' })
    }
  })

  const envFilepath = path.join('apps', 'api', '.env')
  const out = provision({ src: 'HELLO=world', envFilepath })

  ct.equal(out.envKeysFilepath, path.join('apps', 'api', '.env.keys'))
  ct.end()
})
