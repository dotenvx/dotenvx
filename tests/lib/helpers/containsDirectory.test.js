const t = require('tap')

const containsDirectory = require('../../../src/lib/helpers/containsDirectory')

t.test('#containsDirectory', ct => {
  const result = containsDirectory('.env.vault')
  ct.same(result, false)

  const result2 = containsDirectory('directory/.env.vault')
  ct.same(result2, true)

  ct.end()
})
