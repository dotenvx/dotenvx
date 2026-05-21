const t = require('tap')
const path = require('path')

const localDisplayPath = require('../../../src/lib/helpers/localDisplayPath')

t.test('localDisplayPath returns default for missing filepath', (ct) => {
  ct.equal(localDisplayPath(), '.env.keys')
  ct.end()
})

t.test('localDisplayPath returns relative paths unchanged', (ct) => {
  ct.equal(localDisplayPath('.env.keys'), '.env.keys')
  ct.end()
})

t.test('localDisplayPath returns cwd-relative path for absolute filepath', (ct) => {
  const filepath = path.join(process.cwd(), 'tmp', '.env.keys')
  ct.equal(localDisplayPath(filepath), path.join('tmp', '.env.keys'))
  ct.end()
})

t.test('localDisplayPath returns basename when absolute filepath equals cwd', (ct) => {
  const filepath = process.cwd()
  ct.equal(localDisplayPath(filepath), path.basename(filepath))
  ct.end()
})
