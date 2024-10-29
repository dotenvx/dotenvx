const t = require('tap')

const removeOptionsHelpParts = require('../../../src/lib/helpers/removeOptionsHelpParts')

t.test('#removeOptionsHelpParts', ct => {
  const lines = [
    'set [options] <KEY> <value>  set a single environment variable'
  ]

  removeOptionsHelpParts(lines)

  ct.same(lines, [
    'set <KEY> <value>  set a single environment variable'
  ])

  ct.end()
})
