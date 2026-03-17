const t = require('tap')

const publicKeyValue = require('../../../../src/lib/helpers/keyResolution/publicKeyValue')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

let filepath = '.env'

t.test('#publicKeyValue', ct => {
  const result = publicKeyValue(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#publicKeyValue when process.env.DOTENV_PUBLIC_KEY is set', ct => {
  process.env.DOTENV_PUBLIC_KEY = '<publicKey>'

  const result = publicKeyValue(filepath)

  ct.same(result, '<publicKey>')

  ct.end()
})

t.test('#publicKeyValue when process.env.DOTENV_PUBLIC_KEY is set but it is an empty string', ct => {
  process.env.DOTENV_PUBLIC_KEY = ''

  const result = publicKeyValue(filepath)

  ct.same(result, null)

  ct.end()
})

t.test('#publicKeyValue when .env.keys present', ct => {
  filepath = 'tests/monorepo/apps/encrypted/.env'

  const result = publicKeyValue(filepath)

  ct.same(result, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')

  ct.end()
})
