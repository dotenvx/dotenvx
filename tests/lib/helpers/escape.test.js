const t = require('tap')

const escape = require('../../../src/lib/helpers/escape')

t.test('escape single-quotes shell values', ct => {
  ct.equal(escape('World'), "'World'")
  ct.equal(escape("f'bar"), "'f'\\''bar'")
  ct.equal(escape('$(./payload.sh)'), "'$(./payload.sh)'")
  ct.end()
})
