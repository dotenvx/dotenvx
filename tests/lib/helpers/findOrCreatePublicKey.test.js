const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const dotenv = require('dotenv')

const findOrCreatePublicKey = require('../../../src/lib/helpers/findOrCreatePublicKey')

let envFile = 'tests/monorepo/apps/encrypted/.env'
let envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  envFile = 'tests/monorepo/apps/encrypted/.env'
  envKeysFile = 'tests/monorepo/apps/encrypted/.env.keys'
})

t.test('#findOrCreatePublicKey when .env.keys AND DOTENV_PUBLIC_KEY is found', ct => {
  const existingPublicKey = dotenv.parse(fsx.readFileX(envFile)).DOTENV_PUBLIC_KEY
  const existingPrivateKey = dotenv.parse(fsx.readFileX(envKeysFile)).DOTENV_PRIVATE_KEY

  const {
    publicKey,
    privateKey,
    publicKeyAdded,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

  ct.same(publicKey, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')
  ct.same(publicKey, existingPublicKey)
  ct.same(publicKeyAdded, false)
  ct.same(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  ct.same(privateKey, existingPrivateKey)
  ct.same(privateKeyAdded, false)

  // double check outputs
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

  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  ct.end()
})

t.test('#findOrCreatePublicKey when no .env.keys file and no DOTENV_PUBLIC_KEY', ct => {
  envFile = 'tests/monorepo/apps/unencrypted/.env'
  envKeysFile = 'tests/monorepo/apps/unencrypted/.env.keys'

  const existingPublicKey = dotenv.parse(fsx.readFileX(envFile)).DOTENV_PUBLIC_KEY
  ct.same(existingPublicKey, undefined)

  const {
    publicKey,
    privateKey,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

  ct.ok(publicKey)
  ct.ok(privateKey)
  ct.same(privateKeyAdded, true)

  // double check outputs
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

  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  ct.end()
})

t.test('#findOrCreatePublicKey when .env.keys found but with no DOTENV_PRIVATE_KEY and no DOTENV_PUBLIC_KEY', ct => {
  envFile = 'tests/monorepo/apps/unencrypted/.env'
  envKeysFile = 'tests/monorepo/apps/unencrypted/.env.keys'

  const existsSyncStub = sinon.stub(fsx, 'existsSync').returns(true)
  const originalReadFileSync = fsx.readFileX
  const sandbox = sinon.createSandbox()
  sandbox.stub(fsx, 'readFileX').callsFake((filepath, options) => {
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

  ct.ok(publicKey)
  ct.ok(privateKey)
  ct.same(privateKeyAdded, true)

  // double check outputs
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

  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  existsSyncStub.restore()
  sandbox.restore()

  ct.end()
})

t.test('#findOrCreatePublicKey when .env.keys found but no DOTENV_PUBLIC_KEY', ct => {
  const existsSyncStub = sinon.stub(fsx, 'existsSync').returns(true)
  const originalReadFileSync = fsx.readFileX
  const sandbox = sinon.createSandbox()
  sandbox.stub(fsx, 'readFileX').callsFake((filepath, options) => {
    if (filepath === envFile) {
      return 'HELLO="unencrypted"\n'
    } else {
      return originalReadFileSync(filepath, options)
    }
  })

  const existingPublicKey = dotenv.parse(fsx.readFileX(envFile)).DOTENV_PUBLIC_KEY
  const existingPrivateKey = dotenv.parse(fsx.readFileX(envKeysFile)).DOTENV_PRIVATE_KEY
  ct.same(existingPublicKey, undefined)
  ct.ok(existingPrivateKey)

  const {
    publicKey,
    privateKey,
    publicKeyAdded,
    privateKeyAdded,
    envSrc,
    keysSrc
  } = findOrCreatePublicKey(envFile, envKeysFile)

  ct.notSame(publicKey, existingPublicKey)
  ct.same(publicKeyAdded, true)
  ct.same(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')
  ct.same(privateKey, existingPrivateKey)
  ct.same(privateKeyAdded, false)

  // double check outputs
  const envOutput = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    'DOTENV_PUBLIC_KEY="03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba"',
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

  ct.same(envOutput.trim(), envSrc.trim())
  ct.same(envKeysOutput.trim(), keysSrc.trim())

  existsSyncStub.restore()
  sandbox.restore()

  ct.end()
})
