const t = require('tap')

const pluralize = require('../../../src/lib/helpers/pluralize')

t.test('#pluralize', ct => {
  const result0 = pluralize('world', 0)
  const result1 = pluralize('world', 1)
  const result2 = pluralize('world', 2)

  ct.same(result0, 'worlds')
  ct.same(result1, 'world')
  ct.same(result2, 'worlds')

  ct.end()
})
