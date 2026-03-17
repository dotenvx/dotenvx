const t = require('tap')

const keyValues = require('../../../../src/lib/helpers/keyResolution/keyValues')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#keyValues', ct => {
  const result = keyValues('.env')

  ct.same(result, { publicKeyValue: null, privateKeyValue: null })

  ct.end()
})

t.test('#keyValues reads from process.env', ct => {
  process.env.DOTENV_PUBLIC_KEY = '<publicKey>'
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  const result = keyValues('.env')

  ct.same(result, { publicKeyValue: '<publicKey>', privateKeyValue: '<privateKey>' })

  ct.end()
})

t.test('#keyValues reads from files', ct => {
  const filepath = 'tests/monorepo/apps/encrypted/.env'

  const result = keyValues(filepath)

  ct.same(result, {
    publicKeyValue: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
    privateKeyValue: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1'
  })

  ct.end()
})
