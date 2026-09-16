const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const proxyquire = require('proxyquire')
const { keypair, scan, publickeys, decrypt } = require('@dotenvx/primitives')
const file = require('../../../src/lib/custodians/local/file')
const { unlockedValue } = require('../../../src/cli/actions/lock/down')
const LockDown = require('../../../src/lib/services/lockDown')

function setup (password) {
  let prompts = 0
  let paused = 0
  let resumed = 0
  const protection = proxyquire('../../../src/lib/custodians/lock', {
    '../helpers/prompts': { password: async () => { prompts++; return password() } },
    '../helpers/createSpinner': { pause: () => { paused++ }, resume: () => { resumed++ } }
  })
  const { createRegistry } = proxyquire('../../../src/lib/custodians', { './lock': protection })
  const registry = createRegistry([file])
  const custodian = { store: (publicKey, privateKey, context) => registry.store({ id: 'file', lock: true }, publicKey, privateKey, context) }
  return { custodian, registry, counts: () => ({ prompts, paused, resumed }) }
}

t.test('locks staged keys using the existing lock format and scopes the passphrase to one operation', async t => {
  const { custodian, counts } = setup(() => 'test-passphrase')
  const first = keypair()
  const second = keypair()
  const context = { privateKeyName: 'DOTENV_PRIVATE_KEY', comment: '.env' }
  const result = await custodian.store(first.publicKey, first.privateKey, context)
  context.keysSrc = result.keysSrc
  context.privateKeyName = 'DOTENV_PRIVATE_KEY_PRODUCTION'
  const next = await custodian.store(second.publicKey, second.privateKey, context)
  const parsed = scan(next.keysSrc).parsed
  t.notMatch(next.keysSrc, first.privateKey)
  t.notMatch(next.keysSrc, second.privateKey)
  t.notMatch(next.keysSrc, 'test-passphrase')
  t.equal(unlockedValue(parsed.DOTENV_PRIVATE_KEY[0], 'test-passphrase'), first.privateKey)
  t.equal(unlockedValue(parsed.DOTENV_PRIVATE_KEY_PRODUCTION[0], 'test-passphrase'), second.privateKey)
  t.throws(() => unlockedValue(parsed.DOTENV_PRIVATE_KEY[0], 'wrong-password'))
  t.same(counts(), { prompts: 1, paused: 1, resumed: 1 })
  await custodian.store(first.publicKey, first.privateKey, { privateKeyName: 'DOTENV_PRIVATE_KEY' })
  t.equal(counts().prompts, 2, 'a new operation prompts again')
})

t.test('empty and cancelled passphrases fail without staging plaintext and resume the spinner', async t => {
  const kp = keypair()
  for (const password of [() => '', () => { throw Object.assign(new Error('cancelled'), { code: 'PROMPT_CANCELLED' }) }]) {
    const { custodian, counts } = setup(password)
    const context = { keysSrc: '# existing\n', privateKeyName: 'DOTENV_PRIVATE_KEY' }
    await t.rejects(custodian.store(kp.publicKey, kp.privateKey, context))
    t.equal(context.keysSrc, '# existing\n')
    t.same(counts(), { prompts: 1, paused: 1, resumed: 1 })
  }
})

for (const name of ['encrypt', 'set']) {
  t.test(`${name} creates locked custody for multiple env files and lock down unlocks it`, async t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-locked-custody-'))
    t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
    const envFiles = [path.join(dir, '.env'), path.join(dir, '.env.production')]
    for (const env of envFiles) fs.writeFileSync(env, 'HELLO=world\n')
    const fk = path.join(dir, 'custom.keys')
    const { registry, counts } = setup(() => 'test-passphrase')
    const transform = proxyquire(`../../../src/lib/transforms/${name}`, {
      '../helpers/selectKeyStorage': async () => ({ id: 'file', lock: true }),
      '../custodians': registry
    })
    const result = await transform({
      envs: envFiles.map(value => ({ type: 'envFile', value })),
      fk,
      key: 'HELLO',
      value: 'changed',
      encrypt: true,
      noNative: true,
      noArmor: true,
      no1Password: true,
      noBitwarden: true
    })
    t.equal(counts().prompts, 1)
    t.equal(fs.existsSync(fk), false, 'transform does not write a plaintext key file')
    const values = Object.values(scan(result.keysSrc).parsed).flat()
    t.equal(values.length, 2)
    t.ok(values.every(value => value.startsWith('locked:')))
    fs.writeFileSync(fk, result.keysSrc)
    for (const row of result.processedEnvs) {
      t.notOk(row.error)
      fs.writeFileSync(row.filepath, row.envSrc)
      const unlocked = new LockDown(row.filepath, fk).run(value => unlockedValue(value, 'test-passphrase'))
      const privateKey = unlocked.results[0].privateKeyValue
      t.equal(publickeys(row.envSrc)[0], unlocked.results[0].publicKeyValue)
      t.equal(decrypt(privateKey, scan(row.envSrc).parsed.HELLO[0]), name === 'set' ? 'changed' : 'world')
    }
  })
}
