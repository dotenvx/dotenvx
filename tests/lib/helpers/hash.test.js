const t = require('tap')

const hash = require('../../../src/lib/helpers/hash')

t.test('#hash', ct => {
  const hashed = hash('hash this')

  ct.same(hashed, '48bd3ddc')

  ct.end()
})
