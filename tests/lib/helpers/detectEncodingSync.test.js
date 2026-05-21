const t = require('tap')
const path = require('path')

const detectEncodingSync = require('../../../src/lib/helpers/detectEncodingSync')

t.test('#detectEncodingSync utf8', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env')

  ct.equal(detectEncodingSync(filepath), 'utf8', 'Correctly detected utf8 encoding')

  ct.end()
})

t.test('#detectEncodingSync utf16le', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env.utf16le')

  ct.equal(detectEncodingSync(filepath), 'utf16le', 'Correctly detected utf16le encoding')

  ct.end()
})

t.test('#detectEncodingSync fallback utf8 (latin1)', ct => {
  const filepath = path.resolve(__dirname, '../../', '.env.latin1')

  ct.equal(detectEncodingSync(filepath), 'utf8', 'Correctly fellback to utf8 encoding')

  ct.end()
})
