const t = require('tap')
const path = require('path')

const resolvePath = require('../../../src/lib/helpers/resolvePath')

t.test('#resolvePath', ct => {
  const result = resolvePath('file')

  ct.same(result, path.resolve(process.cwd(), 'file'))

  ct.end()
})
