const t = require('tap')
const proxyquire = require('proxyquire')
const { keypair, scan } = require('@dotenvx/primitives')
const file = require('../../../src/lib/custodians/local/file')
const lockedValue = require('../../../src/lib/helpers/lockedValue')
const matchesStoredKey = require('../../../src/lib/helpers/matchesStoredKey')

function setup (t) {
  for (const stream of [process.stdin, process.stderr]) {
    const descriptor = Object.getOwnPropertyDescriptor(stream, 'isTTY')
    Object.defineProperty(stream, 'isTTY', { configurable: true, value: true })
    t.teardown(() => {
      if (descriptor) Object.defineProperty(stream, 'isTTY', descriptor)
      else delete stream.isTTY
    })
  }
  const ci = process.env.CI
  delete process.env.CI
  t.teardown(() => { if (ci === undefined) delete process.env.CI; else process.env.CI = ci })
  let passphrase = 'test-passphrase'
  let prompts = 0
  const protection = proxyquire('../../../src/lib/custodians/lock', {
    '../helpers/prompts': { password: async () => { prompts++; return passphrase } },
    '../helpers/createSpinner': { pause () {}, resume () {} }
  })
  const { createRegistry } = proxyquire('../../../src/lib/custodians', { './lock': protection })
  return { createRegistry, protection, prompts: () => prompts, password: value => { passphrase = value } }
}

function store (id, overrides = {}) {
  let saved
  return {
    id,
    name: id,
    enabled: () => true,
    available: () => true,
    store (pub, value) { saved = value },
    get: pub => ({ [pub]: saved }),
    getSync: pub => ({ [pub]: saved }),
    ...overrides
  }
}

t.test('locking is optional and independent of local storage; reads unlock in memory', async t => {
  const { createRegistry, prompts } = setup(t)
  const kp = keypair()
  for (const id of ['native', 'onepassword', 'bitwarden']) {
    const custodian = store(id)
    const registry = createRegistry([custodian])
    const before = prompts()
    await registry.store(id, kp.publicKey, kp.privateKey)
    t.same(await registry.providers()[0](kp.publicKey), { [kp.publicKey]: kp.privateKey })
    t.equal(prompts(), before, 'default storage does not prompt')
    await registry.store({ id, lock: true }, kp.publicKey, kp.privateKey)
    const locked = custodian.get(kp.publicKey)[kp.publicKey]
    t.match(locked, `locked:${kp.publicKey}:`)
    t.notMatch(locked, kp.privateKey)
    t.same(await registry.providers()[0](kp.publicKey), { [kp.publicKey]: kp.privateKey })
    t.equal(custodian.get(kp.publicKey)[kp.publicKey], locked, 'unlock does not overwrite stored custody')
    t.throws(() => registry.providers({}, true)[0](kp.publicKey), { code: 'LOCKED_PRIVATE_KEY' })
  }
})

t.test('native fallback keeps the password lock and only prompts once', async t => {
  const { createRegistry, prompts } = setup(t)
  const kp = keypair()
  const native = store('native', { store: () => ({ fallback: 'file' }) })
  const registry = createRegistry([native, file])
  const result = await registry.store({ id: 'native', lock: true }, kp.publicKey, kp.privateKey, { privateKeyName: 'DOTENV_PRIVATE_KEY' })
  t.match(scan(result.keysSrc).parsed.DOTENV_PRIVATE_KEY[0], `locked:${kp.publicKey}:`)
  t.notMatch(result.keysSrc, kp.privateKey)
  t.equal(prompts(), 1)
})

t.test('wrong passwords, corrupted payloads, mismatched keys and noninteractive reads fail closed', async t => {
  const { protection, password, prompts } = setup(t)
  const kp = keypair()
  const locked = lockedValue(kp.privateKey, 'test-passphrase', kp.publicKey)
  t.ok(matchesStoredKey(kp.publicKey, locked))
  t.notOk(matchesStoredKey(keypair().publicKey, locked))
  t.notOk(matchesStoredKey(kp.publicKey, locked.slice(0, -4)))
  password('wrong')
  await t.rejects(protection.unlock(kp.publicKey, { [kp.publicKey]: locked }), {
    code: 'INVALID_PASSPHRASE',
    message: '[INVALID_PASSPHRASE] could not unlock DOTENV_PRIVATE_KEY using passphrase',
    messageWithHelp: '[INVALID_PASSPHRASE] could not unlock DOTENV_PRIVATE_KEY using passphrase. fix: [try again with the correct passphrase]'
  })
  password('test-passphrase')
  const payload = Buffer.from(locked.split(':')[2], 'base64url')
  payload[30] ^= 1
  const corrupt = `locked:${kp.publicKey}:${payload.toString('base64url')}`
  await t.rejects(protection.unlock(kp.publicKey, { [kp.publicKey]: corrupt }), { code: 'INVALID_PASSPHRASE' })
  const other = keypair()
  const mismatched = lockedValue(other.privateKey, 'test-passphrase', kp.publicKey)
  await t.rejects(protection.unlock(kp.publicKey, { [kp.publicKey]: mismatched }), { code: 'INVALID_PASSPHRASE' })
  const before = prompts()
  process.env.CI = 'true'
  await t.rejects(protection.unlock(kp.publicKey, { [kp.publicKey]: locked }), { code: 'LOCKED_PRIVATE_KEY' })
  t.equal(prompts(), before)
})

t.test('managed custody rejects locking before prompting or writing', async t => {
  const { createRegistry, prompts } = setup(t)
  const kp = keypair()
  const registry = createRegistry([store('armored', { custody: 'managed' })])
  await t.rejects(registry.store({ id: 'armored', lock: true }, kp.publicKey, kp.privateKey), /only supported for local custody/)
  t.equal(prompts(), 0)
})

t.test('1Password and Bitwarden readers preserve locked envelopes for the shared unlock layer', t => {
  const kp = keypair()
  const locked = lockedValue(kp.privateKey, 'test-passphrase', kp.publicKey)
  const account = 'a'.repeat(26)
  const op = proxyquire('../../../src/lib/custodians/local/onepassword', {
    '../../../db/session': class Session {
      openStore () { return { get: () => `${account}|op://${account}/${account}/password` } }
    },
    child_process: { execFileSync: () => locked }
  })
  t.same(op.getSync(kp.publicKey), { [kp.publicKey]: locked })
  const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const locator = Buffer.from(JSON.stringify({ userId, item: userId, serverUrl: '' })).toString('base64')
  const originalSession = process.env.BW_SESSION
  process.env.BW_SESSION = 'test-session'
  t.teardown(() => {
    if (originalSession === undefined) delete process.env.BW_SESSION
    else process.env.BW_SESSION = originalSession
  })
  const bw = proxyquire('../../../src/lib/custodians/local/bitwarden', {
    '../../../db/session': class Session {
      openStore () { return { get: () => locator } }
    },
    child_process: {
      execFileSync: (command, args) => args[0] === 'status'
        ? JSON.stringify({ userId, serverUrl: '', status: 'unlocked' })
        : locked
    }
  })
  t.same(bw.getSync(kp.publicKey), { [kp.publicKey]: locked })
  const other = keypair()
  t.throws(() => op.getSync(other.publicKey), { code: '1PASSWORD_FAILED' })
  t.throws(() => bw.getSync(other.publicKey), { code: 'BITWARDEN_FAILED' })
  t.end()
})
