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

t.test('#smartDotenvPrivateKey when .env.keys present but filename is not .env (use invertse of DOTENV_PUBLIC_KEY* in the filename (if exists))', ct => {
  filepath = 'tests/monorepo/apps/encrypted/secrets.txt'

  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#smartDotenvPrivateKey when DOTENV_PRIVATE_KEY passed and custom filename', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  filepath = 'tests/monorepo/apps/encrypted/secrets.txt'

  const result = smartDotenvPrivateKey(filepath)

  ct.same(result, '<privateKey>')

  ct.end()
})

t.test('#smartDotenvPrivateKey when DOTENV_PRIVATE_KEY passed and custom filename but custom filename has a different named DOTENV_PUBLIC_KEY', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  filepath = 'tests/monorepo/apps/encrypted/secrets.ci.txt'

  const result = smartDotenvPrivateKey(filepath)
  ct.same(result, null) // it should not find it because it is instead looking for a DOTENV_PRIVATE_KEY_CI (see secrets.ci.txt contents)

  // matching ci key is set - inverse of the ci public key in the secrets.ci.txt file
  process.env.DOTENV_PRIVATE_KEY_CI = '<privateKeyCi>'
  const result2 = smartDotenvPrivateKey(filepath)
  ct.same(result2, '<privateKeyCi>')

  // an additional random key is set but still with the dotenv private key schema
  process.env.DOTENV_PRIVATE_KEY_PRODUCTION = '<privateKeyProduction>'
  const result3 = smartDotenvPrivateKey(filepath)
  ct.same(result3, '<privateKeyCi>') // it should still find the CI one first

  ct.end()
})
