const t = require('tap')
const { createRegistry } = require('../../../src/lib/custodians')
const file = require('../../../src/lib/custodians/local/file')

function plugin (id, overrides = {}) {
  return { id, name: id, enabled: () => true, available: async () => true, store: async () => {}, ...overrides }
}

t.test('custom custodians participate in selection, writes and ordered lookup', async t => {
  const writes = []
  const custom = plugin('custom', {
    configured: () => true,
    get (key) { return { [key]: this.id } },
    getSync (key) { return { [key]: this.id } },
    store (...args) { writes.push(args) }
  })
  const registry = createRegistry([custom, file])
  t.same(await registry.choices(), [
    { name: 'custom', value: 'custom', disabled: false },
    { name: 'File (.env.keys)', value: 'file', disabled: false }
  ])
  t.same(await registry.store('custom', 'public', 'private', { comment: '.env' }), {})
  t.same(writes, [['public', 'private', { comment: '.env' }]])
  t.same(await registry.providers()[0]('public'), { public: 'custom' })
  t.same(registry.providers({}, true)[0]('public'), { public: 'custom' })
  t.equal(registry.providers().length, 1, 'file keys remain in the existing env resolution layer')
})

t.test('disabled custodians are never probed or read; unconfigured ones are not read', async t => {
  const registry = createRegistry([
    plugin('disabled', { enabled: () => false, available () { throw new Error('must not probe') }, get () {} }),
    plugin('unconfigured', { configured: () => false, get () {} }),
    plugin('first', { get: key => ({ [key]: 'first' }), getSync: key => ({ [key]: 'first-sync' }) }),
    plugin('second', { get: key => ({ [key]: 'second' }), getSync: key => ({ [key]: 'second-sync' }) })
  ])
  t.equal((await registry.choices())[0].disabled, true)
  t.same(await Promise.all(registry.providers().map(fn => fn('key'))), [{ key: 'first' }, { key: 'second' }])
  t.same(registry.providers({}, true).map(fn => fn('key')), [{ key: 'first-sync' }, { key: 'second-sync' }])
})

t.test('fallback stages file keys and preserves earlier staged keys', async t => {
  const registry = createRegistry([plugin('native', { store: () => ({ fallback: 'file' }) }), file])
  const result = await registry.store('native', 'public', 'private', {
    keysSrc: 'DOTENV_PRIVATE_KEY=existing\n', privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION', comment: '.env.production'
  })
  t.match(result.keysSrc, 'DOTENV_PRIVATE_KEY=existing')
  t.match(result.keysSrc, 'DOTENV_PRIVATE_KEY_PRODUCTION=private')
})

t.test('write failures do not fall back to file custody', async t => {
  let written = false
  const registry = createRegistry([
    plugin('broken', { store () { throw new Error('verification failed') } }),
    plugin('file', { store () { written = true } })
  ])
  await t.rejects(registry.store('broken', 'public', 'private'), /verification failed/)
  t.equal(written, false)
  await t.rejects(registry.store('unknown', 'public', 'private'), /unknown custodian/)
})

t.test('invalid registration and unsupported synchronous reads fail explicitly', t => {
  t.throws(() => createRegistry([plugin('same'), plugin('same')]), /unique/)
  t.throws(() => createRegistry([{ id: 'bad' }]), /requires enabled/)
  const registry = createRegistry([plugin('async', { get: async () => ({}) })])
  t.throws(() => registry.providers({}, true), /does not support synchronous reads/)
  t.end()
})
