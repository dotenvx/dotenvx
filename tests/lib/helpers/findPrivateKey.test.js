const t = require('tap')
const findPrivateKey = require('../../../src/lib/helpers/findPrivateKey')

t.test('#findPrivateKey', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/.env'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#findPrivateKey non-standard .env name (secrets.txt)', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/secrets.txt'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})

t.test('#findPrivateKey non-standard .env name with no matching private key (secrets.ci.txt)', ct => {
  const envFilepath = 'tests/monorepo/apps/encrypted/secrets.ci.txt'
  const privateKey = findPrivateKey(envFilepath)

  t.equal(privateKey, null)

  ct.end()
})
