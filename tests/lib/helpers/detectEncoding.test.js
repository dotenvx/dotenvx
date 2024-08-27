const t = require('tap')
const path = require('path')

const detectEncoding = require('../../../src/lib/helpers/detectEncoding')

t.test('#detectEncoding utf8', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env')

  ct.equal(detectEncoding(filepath), 'utf8', 'Correctly detected utf8 encoding')

  ct.end()
})

t.test('#detectEncoding utf16le', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env.utf16le')

  ct.equal(detectEncoding(filepath), 'utf16le', 'Correctly detected utf16le encoding')

  ct.end()
})

t.test('#detectEncoding fallback utf8 (latin1)', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env.latin1')

  ct.equal(detectEncoding(filepath), 'utf8', 'Correctly fellback to utf8 encoding')

  ct.end()
})
