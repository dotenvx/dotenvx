const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')
const { keypair, encrypt } = require('@dotenvx/primitives')
const dotenvx = require('../../src/lib/main')
const lockedValue = require('../../src/lib/helpers/lockedValue')
const protection = require('../../src/lib/custodians/lock')
const proxyquire = require('proxyquire')

function fixture (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-lock-password-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  const kp = keypair()
  const password = 'test-lock-password-47'
  const envFile = path.join(dir, '.env')
  const keysFile = path.join(dir, '.env.keys')
  const keys = `DOTENV_PRIVATE_KEY=${lockedValue(kp.privateKey, password, kp.publicKey)}\n`
  fs.writeFileSync(keysFile, keys)
  fs.writeFileSync(envFile, `DOTENV_PUBLIC_KEY=${kp.publicKey}\nHELLO=${encrypt(kp.publicKey, 'world')}\n`)
  return { dir, kp, password, envFile, keysFile, keys }
}

const disabled = { noArmor: true, noNative: true, no1Password: true, noBitwarden: true }

t.test('synchronous config unlocks .env.keys in memory with lockPassword', t => {
  const f = fixture(t)
  const options = { ...disabled, path: f.envFile, processEnv: {}, quiet: true, strict: true }
  const result = dotenvx.config({ ...options, lockPassword: f.password })
  t.equal(result.parsed.HELLO, 'world')
  t.equal(fs.readFileSync(f.keysFile, 'utf8'), f.keys, 'key file remains locked')
  t.throws(() => dotenvx.config({ ...options, processEnv: {}, lockPassword: 'wrong' }), { code: 'INVALID_PASSPHRASE' })
  t.throws(() => dotenvx.config({ ...options, processEnv: {} }), { code: 'LOCKED_PRIVATE_KEY' })
  t.end()
})

t.test('custom key-file arrays and environment-supplied locked keys work', t => {
  const f = fixture(t)
  const custom = path.join(f.dir, 'custom.keys')
  fs.renameSync(f.keysFile, custom)
  const options = { ...disabled, path: f.envFile, quiet: true, strict: true, lockPassword: f.password }
  t.equal(dotenvx.config({ ...options, processEnv: {}, envKeysFile: [path.join(f.dir, 'missing'), custom] }).parsed.HELLO, 'world')
  const locked = lockedValue(f.kp.privateKey, f.password, f.kp.publicKey)
  t.equal(dotenvx.config({ ...options, processEnv: { DOTENV_PRIVATE_KEY: locked } }).parsed.HELLO, 'world')
  t.end()
})

t.test('custodian readers accept passwords for sync and async unlock without prompting', async t => {
  const f = fixture(t)
  const locked = lockedValue(f.kp.privateKey, f.password, f.kp.publicKey)
  const { createRegistry } = require('../../src/lib/custodians')
  const registry = createRegistry([{
    id: 'test',
    name: 'test',
    enabled: () => true,
    available: () => true,
    store () {},
    get: () => ({ [f.kp.publicKey]: locked }),
    getSync: () => ({ [f.kp.publicKey]: locked })
  }])
  t.equal(registry.providers({ lockPassword: f.password }, true)[0](f.kp.publicKey)[f.kp.publicKey], f.kp.privateKey)
  t.equal((await registry.providers({ lockPassword: f.password })[0](f.kp.publicKey))[f.kp.publicKey], f.kp.privateKey)
  t.throws(() => protection.unlockSync(f.kp.publicKey, { [f.kp.publicKey]: locked }, { lockPassword: 'wrong' }), { code: 'INVALID_PASSPHRASE' })
  const noPrompt = proxyquire('../../src/lib/custodians/lock', {
    '../helpers/prompts': { password () { throw new Error('must not prompt') } }
  })
  await t.rejects(noPrompt.unlock(f.kp.publicKey, { [f.kp.publicKey]: locked }, { lockPassword: 'wrong' }), { code: 'INVALID_PASSPHRASE' })
})

t.test('get and run accept --lock-password in noninteractive mode without logging it', t => {
  const f = fixture(t)
  const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
  const flags = ['--no-armor', '--no-native', '--no-1password', '--no-bitwarden', '--strict', '-f', f.envFile]
  const execute = args => spawnSync(process.execPath, [cli, ...args], {
    cwd: f.dir, encoding: 'utf8', env: { ...process.env, CI: 'true', DOTENVX_NO_ARMOR: 'true' }
  })
  for (const command of ['get', 'run']) {
    const tail = command === 'run' ? ['--', process.execPath, '-e', 'console.log(process.env.HELLO)'] : []
    const args = [command, ...(command === 'get' ? ['HELLO'] : []), ...flags, '--lock-password', f.password, '--debug', ...tail]
    const result = execute(args)
    t.equal(result.status, 0, result.stderr)
    t.match(result.stdout, 'world')
    t.notMatch(result.stdout + result.stderr, f.password)
    const bad = execute([command, ...(command === 'get' ? ['HELLO'] : []), ...flags, '--lock-password=wrong', ...tail])
    t.equal(bad.status, 1)
    t.match(bad.stdout + bad.stderr, '[INVALID_PASSPHRASE]')
    t.notMatch(bad.stdout, 'world')
  }
  t.equal(fs.readFileSync(f.keysFile, 'utf8'), f.keys)
  t.end()
})

t.test('preset password supports config and custodian reads; explicit values take precedence', async t => {
  const f = fixture(t)
  const original = process.env.DOTENVX_LOCK_PASSWORD
  t.teardown(() => {
    if (original === undefined) delete process.env.DOTENVX_LOCK_PASSWORD
    else process.env.DOTENVX_LOCK_PASSWORD = original
  })
  const options = { ...disabled, path: f.envFile, quiet: true, strict: true }
  process.env.DOTENVX_LOCK_PASSWORD = f.password
  t.equal(dotenvx.config({ ...options, processEnv: {} }).parsed.HELLO, 'world')
  t.throws(() => dotenvx.config({ ...options, processEnv: {}, lockPassword: 'wrong' }), { code: 'INVALID_PASSPHRASE' })
  t.throws(() => dotenvx.config({ ...options, processEnv: {}, lockPassword: '' }), { code: 'INVALID_PASSPHRASE' })
  const ring = { [f.kp.publicKey]: lockedValue(f.kp.privateKey, f.password, f.kp.publicKey) }
  t.equal((await protection.unlock(f.kp.publicKey, ring))[f.kp.publicKey], f.kp.privateKey)
  t.equal(protection.unlockSync(f.kp.publicKey, ring)[f.kp.publicKey], f.kp.privateKey)
  process.env.DOTENVX_LOCK_PASSWORD = 'wrong'
  t.equal(dotenvx.config({ ...options, processEnv: {}, lockPassword: f.password }).parsed.HELLO, 'world')
  t.throws(() => dotenvx.config({ ...options, processEnv: {} }), { code: 'INVALID_PASSPHRASE' })
})

t.test('run, get, and lock commands use the preset without terminal input', t => {
  const f = fixture(t)
  const cli = path.resolve(__dirname, '../../src/cli/dotenvx.js')
  const flags = ['--no-armor', '--no-native', '--no-1password', '--no-bitwarden', '--strict', '-f', f.envFile]
  const execute = (args, password = f.password) => spawnSync(process.execPath, [cli, ...args], {
    cwd: f.dir, encoding: 'utf8', env: { ...process.env, CI: 'true', DOTENVX_NO_ARMOR: 'true', DOTENVX_LOCK_PASSWORD: password }
  })
  for (const command of ['get', 'run']) {
    const tail = command === 'run' ? ['--', process.execPath, '-e', 'console.log(process.env.HELLO)'] : []
    const args = [command, ...(command === 'get' ? ['HELLO'] : []), ...flags, '--debug']
    const result = execute([...args, ...tail])
    t.equal(result.status, 0, result.stderr)
    t.match(result.stdout, 'world')
    t.notMatch(result.stdout + result.stderr, f.password)
    const overridden = execute([...args, '--lock-password', f.password, ...tail], 'wrong')
    t.equal(overridden.status, 0, overridden.stderr)
    t.notMatch(overridden.stdout + overridden.stderr, f.password)
  }
  const down = execute(['lock', 'down', '-f', f.envFile, '-fk', f.keysFile])
  t.equal(down.status, 0, down.stderr)
  t.match(fs.readFileSync(f.keysFile, 'utf8'), f.kp.privateKey)
  const up = execute(['lock', 'up', '-f', f.envFile, '-fk', f.keysFile])
  t.equal(up.status, 0, up.stderr)
  t.notMatch(fs.readFileSync(f.keysFile, 'utf8'), f.kp.privateKey)
  t.match(fs.readFileSync(f.keysFile, 'utf8'), 'locked:')
  t.end()
})
