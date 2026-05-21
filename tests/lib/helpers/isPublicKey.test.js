const t = require('tap')
const isPublicKey = require('../../../src/lib/helpers/cryptography/isPublicKey')

t.test('#isPublicKey not encrypted but DOTENV_PUBLIC_KEY', ct => {
  const result = isPublicKey('DOTENV_PUBLIC_KEY')
  ct.same(result, true)
  ct.end()
})

t.test('#isPublicKey not encrypted but DOTENV_PUBLIC_KEY_PRODUCTION', ct => {
  const result = isPublicKey('DOTENV_PUBLIC_KEY_PRODUCTION')
  ct.same(result, true)
  ct.end()
})
