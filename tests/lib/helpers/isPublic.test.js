const t = require('tap')
const isPublic = require('../../../src/lib/helpers/isPublic')

t.test('#isPublic', ct => {
  const result = isPublic('public:value')
  ct.same(result, true)
  ct.end()
})

t.test('#isPublic real world', ct => {
  const result = isPublic('public:https://example.com')
  ct.same(result, true)
  ct.end()
})

t.test('#isPublic not public', ct => {
  const result = isPublic('value')
  ct.same(result, false)
  ct.end()
})

t.test('#isPublic passes null', ct => {
  const result = isPublic(null)
  ct.same(result, false)
  ct.end()
})

t.test('#isPublic encrypted value is not public', ct => {
  const result = isPublic('encrypted:BHqJQhgpCHY4My3PQ1UE3vSTyfqM')
  ct.same(result, false)
  ct.end()
})

t.test('#isPublic empty value after prefix is still public', ct => {
  const result = isPublic('public:')
  ct.same(result, true)
  ct.end()
})
