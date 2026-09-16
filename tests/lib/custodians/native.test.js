const t = require('tap')
const proxyquire = require('proxyquire')

function storeWith (backend, warnings) {
  return proxyquire('../../../src/lib/custodians/native/store', {
    './backend': backend,
    '../../../shared/logger': { logger: { warn: message => warnings.push(message) } }
  })
}

t.test('only an unavailable OS write permits file fallback', t => {
  const warnings = []
  const store = storeWith({ set () { throw Object.assign(new Error('unavailable'), { code: 'NATIVE_UNAVAILABLE' }) } }, warnings)
  t.equal(store('public', 'private', 'custom.keys'), false)
  t.match(warnings, ['OS secret store unavailable; saving private key to custom.keys'])
  t.end()
})

t.test('OS readback mismatch and read errors never permit fallback', t => {
  const warnings = []
  const mismatch = storeWith({ set () {}, get: () => 'wrong' }, warnings)
  t.throws(() => mismatch('public', 'private', '.env.keys'), { code: 'NATIVE_VERIFY_FAILED' })
  const failure = storeWith({ set () {}, get () { throw Object.assign(new Error('read failed'), { code: 'NATIVE_UNAVAILABLE' }) } }, warnings)
  t.throws(() => failure('public', 'private', '.env.keys'), /read failed/)
  t.same(warnings, [])
  t.end()
})
