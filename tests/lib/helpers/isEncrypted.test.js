const t = require('tap')
const isEncrypted = require('../../../src/lib/helpers/isEncrypted')

t.test('#isEncrypted', ct => {
  const result = isEncrypted('HELLO', 'encrypted:1234')
  ct.same(result, true)
  ct.end()
})

t.test('#isEncrypted not encrypted', ct => {
  const result = isEncrypted('HELLO', '1234')
  ct.same(result, false)
  ct.end()
})

t.test('#isEncrypted not encrypted but DOTENV_PUBLIC_KEY', ct => {
  const result = isEncrypted('DOTENV_PUBLIC_KEY', '1234')
  ct.same(result, true)
  ct.end()
})

t.test('#isEncrypted not encrypted but DOTENV_PUBLIC_KEY_PRODUCTION', ct => {
  const result = isEncrypted('DOTENV_PUBLIC_KEY_PRODUCTION', '1234')
  ct.same(result, true)
  ct.end()
})
