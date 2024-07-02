const t = require('tap')
const isEncrypted = require('../../../src/lib/helpers/isEncrypted')

t.test('#isEncrypted', ct => {
  const result = isEncrypted('HELLO', 'encrypted:1234')
  ct.same(result, true)
  ct.end()
})

t.test('#isEncrypted not encrypted', ct => {
  const result = isEncrypted('HELLO', '1234')
  ct.same(result, false)
  ct.end()
})
