const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const findOrCreatePublicKey = require('../../../src/lib/helpers/findOrCreatePublicKey')

let envFile = 'tests/monorepo/apps/encrypted/.env'
let envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is found', ct => {
  const {
    publicKey,
    privateKey,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

  ct.same(publicKey, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')
  ct.same(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  const envOutput = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    'DOTENV_PUBLIC_KEY="03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba"',
    '',
    '# .env',
    'HELLO="encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=="'
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

  ct.same(privateKeyAdded, false)
  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  ct.end()
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is NOT found', ct => {
  envFile = 'tests/monorepo/apps/unencrypted/.env'
  envKeysFile = 'tests/monorepo/apps/unencrypted/.env.keys'

  const {
    publicKey,
    privateKey,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

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

  ct.same(privateKeyAdded, true)
  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

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
    privateKey,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

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

  ct.same(privateKeyAdded, true)
  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  existsSyncStub.restore()
  ct.end()
})
