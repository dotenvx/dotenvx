const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const Keypair = require('../../../src/lib/services/keypair')

t.beforeEach((ct) => {
  process.env = {}
})

t.afterEach((ct) => {
  sinon.restore()
})

t.test('#runSync (no arguments)',
  async ct => {
    ct.throws(() => new Keypair().runSync(), { code: 'ENOENT' })

    ct.end()
  })

t.test('#runSync (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair({ envFile }).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#runSync (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair({ envFile: [envFile] }).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (no arguments)',
  async ct => {
    await ct.rejects(new Keypair().run(), { code: 'ENOENT' })

    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair({ envFile }).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair({ envFile: [envFile] }).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run forwards envKeysFilepath to primitive keyring',
  async ct => {
    const keyring = sinon.stub().resolves({
      'public-key': 'private-key'
    })
    const keyringSync = sinon.stub().returns({
      'public-key': 'private-key'
    })
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
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

    const out = await new KeypairWithStubs({
      envFile: '.env',
      envKeysFilepath: '.env.custom.keys'
    }).run()
    const outSync = new KeypairWithStubs({
      envFile: '.env',
      envKeysFilepath: '.env.custom.keys'
    }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.equal(keyring.firstCall.args[0].fk, '.env.custom.keys')
    ct.equal(keyringSync.firstCall.args[0].fk, '.env.custom.keys')
    ct.end()
  })

t.test('#run passes no provider when noArmor is true',
  async ct => {
    const keyring = sinon.stub().callsFake(async ({ ring }) => ring)
    const keyringSync = sinon.stub().callsFake(({ ring }) => ring)
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
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

    const out = await new KeypairWithStubs({
      envFile: '.env',
      noArmor: true
    }).run()
    const outSync = new KeypairWithStubs({
      envFile: '.env',
      noArmor: true
    }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.equal(keyring.firstCall.args[0].provider, null)
    ct.equal(keyringSync.firstCall.args[0].provider, null)
    ct.end()
  })

t.test('#run passes provider by default',
  async ct => {
    const keyring = sinon.stub().callsFake(async ({ ring }) => ring)
    const keyringSync = sinon.stub().callsFake(({ ring }) => ring)
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
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

    const out = await new KeypairWithStubs({ envFile: '.env' }).run()
    const outSync = new KeypairWithStubs({ envFile: '.env' }).runSync()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.same(outSync, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null })
    ct.equal(typeof keyring.firstCall.args[0].provider, 'function')
    ct.equal(typeof keyringSync.firstCall.args[0].provider, 'function')
    ct.end()
  })

t.test('#run forwards onStatus to armor provider',
  async ct => {
    const onStatus = sinon.stub()
    const keyring = sinon.stub().callsFake(async ({ provider }) => ({
      'public-key': await provider('public-key')
    }))
    const armorProvider = sinon.stub().resolves('private-key')
    const KeypairWithStubs = proxyquire('../../../src/lib/services/keypair', {
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

    const out = await new KeypairWithStubs({
      envFile: '.env',
      onStatus
    }).run()

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' })
    ct.same(armorProvider.firstCall.args, ['public-key', { onStatus }])
    ct.end()
  })
