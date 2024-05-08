const t = require('tap')

const smartDotenvPrivateKey = require('../../../src/lib/helpers/smartDotenvPrivateKey')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

let filepath = '.env'

t.test('#smartDotenvPrivateKey', ct => {
  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#smartDotenvPrivateKey when process.env.DOTENV_PRIVATE_KEY is set', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, '<privateKey>')

  ct.end()
})

t.test('#smartDotenvPrivateKey when process.env.DOTENV_PRIVATE_KEY is set but it is an empty string', ct => {
  process.env.DOTENV_PRIVATE_KEY = ''

  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#smartDotenvPrivateKey when .env.keys present', ct => {
  filepath = 'tests/monorepo/apps/encrypted/.env'

  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})
