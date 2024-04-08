const t = require('tap')
const path = require('path')

const helpers = require('./../../src/cli/helpers')

t.test('#resolvePath', ct => {
  const result = helpers.resolvePath('file')

  ct.same(result, path.resolve(process.cwd(), 'file'))

  ct.end()
})

t.test('#pluralize', ct => {
  const result = helpers.pluralize('file', 1)
  ct.same(result, 'file')

  const result2 = helpers.pluralize('file', 2)
  ct.same(result2, 'files')

  ct.end()
})
