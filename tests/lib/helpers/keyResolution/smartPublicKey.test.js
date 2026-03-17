const t = require('tap')

const smartPublicKey = require('../../../../src/lib/helpers/keyResolution/smartPublicKey')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

let filepath = '.env'

t.test('#smartPublicKey', ct => {
  const result = smartPublicKey(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#smartPublicKey when process.env.DOTENV_PUBLIC_KEY is set', ct => {
  process.env.DOTENV_PUBLIC_KEY = '<publicKey>'

  const result = smartPublicKey(filepath)

  ct.same(result, '<publicKey>')

  ct.end()
})

t.test('#smartPublicKey when process.env.DOTENV_PUBLIC_KEY is set but it is an empty string', ct => {
  process.env.DOTENV_PUBLIC_KEY = ''

  const result = smartPublicKey(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#smartPublicKey when .env.keys present', ct => {
  filepath = 'tests/monorepo/apps/encrypted/.env'

  const result = smartPublicKey(filepath)

  ct.same(result, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')

  ct.end()
})
