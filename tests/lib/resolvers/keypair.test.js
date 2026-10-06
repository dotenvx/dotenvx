const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const ring = { 'public-key': 'private-key' }
const expected = { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: 'private-key' }

function setup ({ fileRing = {}, remoteRing = ring, noProvider = false } = {}) {
  const get = sinon.stub().resolves(fileRing)
  const getSync = sinon.stub().returns(fileRing)
  const file = sinon.stub().returns({ get, getSync })
  const provider = sinon.stub().resolves(remoteRing)
  const providerSync = sinon.stub().returns(remoteRing)
  const providers = sinon.stub().resolves(noProvider ? null : provider)
  providers.sync = sinon.stub().returns(noProvider ? null : providerSync)
  // Invoke the resolver's provider so tests exercise file lookup and fallback.
  const keyring = sinon.stub().callsFake(async ({ provider }) => provider('public-key'))
  const keyringSync = sinon.stub().callsFake(({ provider }) => provider('public-key'))
  const keypair = proxyquire('../../../src/lib/resolvers/keypair', {
    './../conventions/keynames': () => ({ publicKeyName: 'DOTENV_PUBLIC_KEY', privateKeyName: 'DOTENV_PRIVATE_KEY' }),
    './../helpers/fsx': {
      readFileX: async () => 'DOTENV_PUBLIC_KEY="public-key"',
      readFileXSync: () => 'DOTENV_PUBLIC_KEY="public-key"'
    },
    './../providers': providers,
    '@dotenvx/providers': { file },
    '@dotenvx/primitives': { publickeys: () => ['public-key'], keyring, keyringSync }
  })
  return { keypair, file, get, getSync, provider, providerSync, providers, keyring, keyringSync }
}

for (const sync of [false, true]) {
  const mode = sync ? 'sync' : 'async'
  const lookup = (fixture, options) => sync ? fixture.keypair.sync(options) : fixture.keypair(options)

  t.test(`keypair ${mode} reads envKeysFilepath before other providers`, async ct => {
    const fixture = setup({ fileRing: ring })
    const out = await lookup(fixture, {
      envFile: '.env',
      envKeysFilepath: '.env.custom.keys',
      includeProvider: true
    })

    ct.same(out, { ...expected, provider: '.env.keys' })
    ct.same(fixture.file.firstCall.args, [{ fk: '.env.custom.keys' }])
    ct.same((sync ? fixture.getSync : fixture.get).firstCall.args, ['public-key'])
    ct.same((sync ? fixture.keyringSync : fixture.keyring).firstCall.args[0].fk, [])
    ct.equal(fixture.provider.callCount + fixture.providerSync.callCount, 0, 'file key takes precedence')
  })

  t.test(`keypair ${mode} handles missing keys when no provider is enabled`, async ct => {
    const fixture = setup({ noProvider: true })
    const out = await lookup(fixture, { envFile: '.env', noArmor: true, includeProvider: true })

    ct.same(out, { DOTENV_PUBLIC_KEY: 'public-key', DOTENV_PRIVATE_KEY: null, provider: null })
    ct.equal((sync ? fixture.providers.sync : fixture.providers).firstCall.args[0].noArmor, true)
    ct.same((sync ? fixture.getSync : fixture.get).firstCall.args, ['public-key'])
  })

  t.test(`keypair ${mode} still reads file keys with noArmor`, async ct => {
    const fixture = setup({ noProvider: true, fileRing: ring })
    ct.same(await lookup(fixture, { envFile: '.env', noArmor: true }), expected)
  })

  t.test(`keypair ${mode} falls back to a provider when the file has no matching key`, async ct => {
    const fixture = setup({ fileRing: { 'another-key': 'another-private-key' } })
    const out = await lookup(fixture, { envFile: '.env', includeProvider: true })

    ct.same(out, { ...expected, provider: 'custom' })
    const get = sync ? fixture.getSync : fixture.get
    const provider = sync ? fixture.providerSync : fixture.provider
    ct.same(provider.firstCall.args, ['public-key'])
    ct.ok(get.calledBefore(provider), 'checks the file before falling back')
  })

  t.test(`keypair ${mode} forwards onStatus and reports the provider origin`, async ct => {
    const fixture = setup()
    const onStatus = sinon.stub()
    const providers = sync ? fixture.providers.sync : fixture.providers
    const resolve = publicKey => {
      const options = providers.firstCall.args[0]
      options.onStatus('waiting for approval')
      options.onProvider('armor', publicKey)
      return ring
    }
    if (sync) fixture.providerSync.callsFake(resolve)
    else fixture.provider.callsFake(async publicKey => resolve(publicKey))

    const out = await lookup(fixture, { envFile: '.env', onStatus, includeProvider: true })

    ct.same(out, { ...expected, provider: 'armor' })
    ct.equal(providers.firstCall.args[0].envFile, '.env')
    ct.equal(providers.firstCall.args[0].onStatus, onStatus)
    ct.same(onStatus.firstCall.args, ['waiting for approval'])
  })
}
