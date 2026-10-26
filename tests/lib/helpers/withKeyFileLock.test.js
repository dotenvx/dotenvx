const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const withKeyFileLock = require('../../../src/lib/helpers/withKeyFileLock')

function fixture (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-lock-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  return path.join(dir, '.env.keys')
}

t.test('holds an exclusive lock throughout the operation and releases it', async t => {
  const file = fixture(t)
  t.equal(await withKeyFileLock(file, async () => {
    t.ok(fs.existsSync(`${file}.lock`))
    await t.rejects(withKeyFileLock(file, () => t.fail('contender ran')), { code: 'KEY_FILE_LOCKED' })
    await withKeyFileLock(`${file}.other`, () => t.pass('unrelated key files are independent'))
    return 'result'
  }), 'result')
  t.notOk(fs.existsSync(`${file}.lock`))
  await withKeyFileLock(file, () => t.pass('next operation runs'))
})

t.test('releases after a failed operation without changing its error', async t => {
  const file = fixture(t)
  const failure = new Error('storage failed')
  await t.rejects(withKeyFileLock(file, async () => { throw failure }), failure)
  t.notOk(fs.existsSync(`${file}.lock`))
  await withKeyFileLock(file, () => t.pass('retry succeeds'))
})

t.test('does not steal an old lock or remove a contender lock', async t => {
  const file = fixture(t)
  fs.mkdirSync(`${file}.lock`)
  fs.utimesSync(`${file}.lock`, new Date(0), new Date(0))
  await t.rejects(withKeyFileLock(file, () => t.fail('must not run')), {
    code: 'KEY_FILE_LOCKED',
    message: /only after confirming no encrypt command is running/
  })
  t.ok(fs.existsSync(`${file}.lock`))
  fs.rmdirSync(`${file}.lock`)
  await withKeyFileLock(file, () => t.pass('manual recovery allows another operation'))
})

for (const exists of [false, true]) {
  t.test(`directory aliases share the lock (key file exists: ${exists})`, async t => {
    const file = fixture(t)
    if (exists) fs.writeFileSync(file, '')
    const alias = path.join(path.dirname(file), 'alias')
    fs.symlinkSync(path.dirname(file), alias, process.platform === 'win32' ? 'junction' : 'dir')
    await withKeyFileLock(file, async () => {
      await t.rejects(withKeyFileLock(path.join(alias, '.env.keys'), () => t.fail('alias bypassed lock')), { code: 'KEY_FILE_LOCKED' })
    })
  })
}

t.test('existing key file symlinks share the target lock', { skip: process.platform === 'win32' }, async t => {
  const file = fixture(t)
  fs.writeFileSync(file, '')
  const alias = `${file}.alias`
  fs.symlinkSync(file, alias)
  await withKeyFileLock(file, async () => {
    await t.rejects(withKeyFileLock(alias, () => t.fail('alias bypassed lock')), { code: 'KEY_FILE_LOCKED' })
  })
})

t.test('reports filesystem errors without running the operation', async t => {
  const file = fixture(t)
  await t.rejects(withKeyFileLock(path.join(file, '.env.keys'), () => t.fail('must not run')), { code: 'ENOENT' })
  t.notOk(fs.existsSync(file))
})
