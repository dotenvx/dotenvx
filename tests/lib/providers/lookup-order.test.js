const t = require('tap')
const proxyquire = require('proxyquire')
const { keypair, encrypt } = require('@dotenvx/primitives')
const fs = require('fs')
const os = require('os')
const path = require('path')

function setup (code = 'NO_TEAMS', localRing = {}, passwordRing = {}, interactiveRing = {}, armorRing = {}) {
  const calls = []
  const error = code && Object.assign(new Error(code), { code })
  const adapter = (name, ring, failure) => () => ({
    get: async () => { calls.push(name); if (failure) throw failure; return ring },
    getSync: () => { calls.push(name); if (failure) throw failure; return ring }
  })
  const shared = proxyquire(require.resolve('@dotenvx/providers'), {
    './file': adapter('file', {}),
    './armor': adapter('armor', armorRing, error),
    './native': adapter('native', localRing),
    './onepassword': adapter('onepassword', passwordRing),
    './bitwarden': adapter('bitwarden', {})
  })
  const providers = proxyquire('../../../src/lib/providers', {
    '@dotenvx/providers': shared,
    '../custodians/local/bitwarden': {
      commandEnv: () => ({}),
      enabled: () => true,
      get: async () => { calls.push('interactive'); return interactiveRing }
    }
  })
  return { providers, shared, calls, error }
}

for (const sync of [false, true]) {
  const mode = sync ? 'sync' : 'async'
  const lookupFor = async (providers, options = {}) => sync ? providers.sync(options) : providers(options)
  t.test(`local key avoids Armor entirely (${mode})`, async t => {
    const ring = { public: 'local-key' }
    const { providers, calls } = setup('NO_TEAMS', ring)
    let origin
    const lookup = await lookupFor(providers, { onProvider: name => { origin = name } })
    t.same(await lookup('public'), ring)
    t.same(calls, ['file', 'native'])
    t.equal(origin, { darwin: 'macosKeychain', win32: 'windowsCredentialManager', linux: 'linuxSecretService' }[process.platform] || 'native')
  })

  t.test(`Armor precedes password managers (${mode})`, async t => {
    const ring = { public: 'armor-key' }
    const { providers, calls } = setup(null, {}, { public: 'password-key' }, {}, ring)
    t.same(await (await lookupFor(providers))('public'), ring)
    t.same(calls, ['file', 'native', 'armor'])
  })

  for (const code of [null, 'NO_TEAMS', 'ACCESS_DENIED', 'ACCESS_APPROVAL_REQUIRED', 'UNAUTHORIZED', 'ECONNREFUSED', 'INTERNAL_SERVER_ERROR']) {
    t.test(`Armor ${code || 'miss'} falls through to password managers (${mode})`, async t => {
      const ring = { public: 'password-key' }
      const { providers, calls } = setup(code, {}, ring)
      let origin
      const lookup = await lookupFor(providers, { onProvider: name => { origin = name } })
      t.same(await lookup('public'), ring)
      t.same(calls, ['file', 'native', 'armor', 'onepassword'])
      t.equal(origin, 'onepassword')
    })
    t.test(`unresolved Armor ${code || 'miss'} preserves result (${mode})`, async t => {
      const { providers, calls, error } = setup(code)
      const lookup = await lookupFor(providers)
      if (error) await t.rejects(async () => lookup('public'), error)
      else t.same(await lookup('public'), {})
      t.same(calls, ['file', 'native', 'armor', 'onepassword', 'bitwarden', ...(!sync ? ['interactive'] : [])])
    })
  }

  t.test(`shared provider preserves Armor error without a CLI handler (${mode})`, async t => {
    const { shared, error } = setup('UNAUTHORIZED')
    await t.rejects(async () => shared.provider()[sync ? 'getSync' : 'get']('public'), error)
  })
}

t.test('interactive Bitwarden can resolve an Armor error', async t => {
  const ring = { public: 'interactive-key' }
  const { providers, calls } = setup('UNAUTHORIZED', {}, {}, ring)
  let origin
  const lookup = await providers({ onProvider: name => { origin = name } })
  t.same(await lookup('public'), ring)
  t.same(calls, ['file', 'native', 'armor', 'onepassword', 'bitwarden', 'interactive'])
  t.equal(origin, 'bitwarden')
})

t.test('get decrypts a real encrypted value using the local fallback', async t => {
  const keys = keypair()
  const { providers } = setup('NO_TEAMS', { [keys.publicKey]: keys.privateKey })
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-no-teams-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const envFile = path.join(dir, '.env')
  fs.writeFileSync(envFile, `DOTENV_PUBLIC_KEY=${keys.publicKey}\nHELLO=${encrypt(keys.publicKey, 'World')}\n`)
  const envs = proxyquire('../../../src/lib/resolvers/envs', {
    './../providers': providers,
    './../decryptors': async () => null
  })
  const get = proxyquire('../../../src/lib/resolvers/get', { './envs': envs })
  const result = await get({ key: 'HELLO', envs: [{ type: 'envFile', value: envFile }], processEnv: {} })
  t.same(result.errors, [])
  t.equal(result.parsed.HELLO, 'World')
  t.end()
})
