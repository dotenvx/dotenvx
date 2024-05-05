const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const findOrCreatePublicKey = require('../../../src/lib/helpers/findOrCreatePublicKey')

let writeFileSyncStub
let envFile = 'tests/monorepo/apps/encrypted/.env'
let envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is found', ct => {
  const {
    publicKey,
    privateKey
  } = findOrCreatePublicKey(envFile, envKeysFile)

  ct.same(publicKey, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')
  ct.same(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is NOT found', ct => {
  envFile = 'tests/monorepo/apps/unencrypted/.env'
  envKeysFile = 'tests/monorepo/apps/unencrypted/.env.keys'

  const {
    publicKey,
    privateKey
  } = findOrCreatePublicKey(envFile, envKeysFile)

  t.ok(writeFileSyncStub.called, 'fs.writeFileSync() called')

  const envOutput = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    'HELLO="unencrypted"'
  ].join('\n')

  const envKeysOutput = [
    '#/------------------!DOTENV_PRIVATE_KEYS!-------------------/',
    '#/ private decryption keys. DO NOT commit to source control /',
    '#/     [how it works](https://dotenvx.com/encryption)       /',
    '#/----------------------------------------------------------/',
    '',
    '# .env',
    `DOTENV_PRIVATE_KEY="${privateKey}"`
  ].join('\n')

  sinon.assert.callCount(writeFileSyncStub, 2)

  sinon.assert.calledWithExactly(writeFileSyncStub.getCall(0), envFile, envOutput + '\n')
  sinon.assert.calledWithExactly(writeFileSyncStub.getCall(1), envKeysFile, envKeysOutput + '\n')

  ct.end()
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is NOT found but .env.keys file is already found', ct => {
  envFile = 'tests/monorepo/apps/unencrypted/.env'
  envKeysFile = 'tests/monorepo/apps/unencrypted/.env.keys'

  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
  const originalReadFileSync = fs.readFileSync
  const sandbox = sinon.createSandbox()
  sandbox.stub(fs, 'readFileSync').callsFake((filepath, options) => {
    if (filepath === envKeysFile) {
      return 'DOTENV_VAULT_DEVELOPMENT="encrypted"\n'
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const {
    publicKey,
    privateKey
  } = findOrCreatePublicKey(envFile, envKeysFile)

  t.ok(writeFileSyncStub.called, 'fs.writeFileSync() called')

  const envOutput = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    'HELLO="unencrypted"'
  ].join('\n')

  const envKeysOutput = [
    'DOTENV_VAULT_DEVELOPMENT="encrypted"',
    '',
    '# .env',
    `DOTENV_PRIVATE_KEY="${privateKey}"`
  ].join('\n')

  sinon.assert.callCount(writeFileSyncStub, 2)

  sinon.assert.calledWithExactly(writeFileSyncStub.getCall(0), envFile, envOutput + '\n')
  sinon.assert.calledWithExactly(writeFileSyncStub.getCall(1), envKeysFile, envKeysOutput + '\n')

  existsSyncStub.restore()
  ct.end()
})
