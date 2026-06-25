const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.afterEach((ct) => {
  sinon.restore()
})

t.test('keypair forwards envKeysFilepath to primitive keyring',
  async ct => {
    const keyring = sinon.stub().resolves({
      'public-key': 'private-key'
    })
    const keyringSync = sinon.stub().returns({
      'public-key': 'private-key'
    })
    const keypair = proxyquire('../../../src/lib/resolvers/keypair', {
      './../conventions/keynames': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/fsx': {
        readFileX: async () => 'DOTENV_PUBLIC_KEY="public-key"',
        readFileXSync: () => 'DOTENV_PUBLIC_KEY="public-key"'
      },
      '@dotenvx/primitives': {
        publickeys: () => ['public-key'],
        keyring,
        keyringSync
      }
    })

    const out = await keypair({
      envFile: '.env',
      envKeysFilepath: '.env.custom.keys'
    })
    const outSync = keypair.sync({
      envFile: '.env',
      envKeysFilepath: '.env.custom.keys'
    })

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.equal(keyring.firstCall.args[0].fk, '.env.custom.keys')
    ct.equal(keyringSync.firstCall.args[0].fk, '.env.custom.keys')
    ct.end()
  })

t.test('keypair passes no provider when noArmor is true',
  async ct => {
    const keyring = sinon.stub().callsFake(async ({ ring }) => ring)
    const keyringSync = sinon.stub().callsFake(({ ring }) => ring)
    const keypair = proxyquire('../../../src/lib/resolvers/keypair', {
      './../conventions/keynames': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/fsx': {
        readFileX: async () => 'DOTENV_PUBLIC_KEY="public-key"',
        readFileXSync: () => 'DOTENV_PUBLIC_KEY="public-key"'
      },
      '@dotenvx/primitives': {
        publickeys: () => ['public-key'],
        keyring,
        keyringSync
      }
    })

    const out = await keypair({
      envFile: '.env',
      noArmor: true
    })
    const outSync = keypair.sync({
      envFile: '.env',
      noArmor: true
    })

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.equal(keyring.firstCall.args[0].provider, null)
    ct.equal(keyringSync.firstCall.args[0].provider, null)
    ct.end()
  })

t.test('keypair passes provider by default',
  async ct => {
    const keyring = sinon.stub().callsFake(async ({ ring }) => ring)
    const keyringSync = sinon.stub().callsFake(({ ring }) => ring)
    const keypair = proxyquire('../../../src/lib/resolvers/keypair', {
      './../conventions/keynames': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/fsx': {
        readFileX: async () => 'DOTENV_PUBLIC_KEY="public-key"',
        readFileXSync: () => 'DOTENV_PUBLIC_KEY="public-key"'
      },
      '@dotenvx/primitives': {
        publickeys: () => ['public-key'],
        keyring,
        keyringSync
      }
    })

    const out = await keypair({ envFile: '.env' })
    const outSync = keypair.sync({ envFile: '.env' })

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.equal(typeof keyring.firstCall.args[0].provider, 'function')
    ct.equal(typeof keyringSync.firstCall.args[0].provider, 'function')
    ct.end()
  })

t.test('keypair forwards onStatus to armor provider',
  async ct => {
    const onStatus = sinon.stub()
    const keyring = sinon.stub().callsFake(async ({ provider }) => ({
      'public-key': await provider('public-key')
    }))
    const armorProvider = sinon.stub().resolves('private-key')
    const keypair = proxyquire('../../../src/lib/resolvers/keypair', {
      './../conventions/keynames': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
      './../helpers/fsx': {
        readFileX: async () => 'DOTENV_PUBLIC_KEY="public-key"'
      },
      './../providers/armor/index': armorProvider,
      '@dotenvx/primitives': {
        publickeys: () => ['public-key'],
        keyring,
        keyringSync: sinon.stub()
      }
    })

    const out = await keypair({
      envFile: '.env',
      onStatus
    })

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.same(armorProvider.firstCall.args, ['public-key', { onStatus }])
    ct.end()
  })
