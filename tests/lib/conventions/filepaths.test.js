const t = require('tap')
const filepaths = require('../../../src/lib/conventions/filepaths')

t.test('filepaths defaults to .env', ct => {
  ct.same(filepaths(), ['.env'])
  ct.end()
})

t.test('filepaths wraps a string', ct => {
  ct.same(filepaths('.env.production'), ['.env.production'])
  ct.end()
})

t.test('filepaths returns arrays as-is', ct => {
  const paths = ['.env', '.env.production']
  ct.equal(filepaths(paths), paths)
  ct.end()
})
