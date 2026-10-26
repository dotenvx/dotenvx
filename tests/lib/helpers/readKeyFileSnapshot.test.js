const t = require('tap')
const fs = require('fs')
const os = require('os')
const path = require('path')
const proxyquire = require('proxyquire')
const readKeyFileSnapshot = require('../../../src/lib/helpers/readKeyFileSnapshot')

function fixture (t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-snapshot-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  return path.join(dir, '.env.keys')
}

t.test('missing, empty and nonempty files have distinct exact snapshots', async t => {
  const file = fixture(t)
  t.same(await readKeyFileSnapshot(file), { contents: null })
  fs.writeFileSync(file, '')
  t.same(await readKeyFileSnapshot(file), { contents: Buffer.alloc(0) })
  const bytes = Buffer.from('\uFEFF# test keys\r\n', 'utf16le')
  fs.writeFileSync(file, bytes)
  const snapshot = await readKeyFileSnapshot(file)
  t.same(snapshot.contents, bytes)
  fs.writeFileSync(file, '# changed\n')
  t.same(snapshot.contents, bytes, 'snapshot does not follow later writes')
})

for (const code of ['EACCES', 'EPERM', 'EIO']) {
  t.test(`does not mistake ${code} for a missing file`, async t => {
    const error = Object.assign(new Error('injected read failure'), { code })
    const read = proxyquire('../../../src/lib/helpers/readKeyFileSnapshot', {
      fs: { promises: { readFile: async () => { throw error } } }
    })
    await t.rejects(read('unused'), error)
  })
}
