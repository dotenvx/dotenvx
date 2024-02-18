const t = require('tap')

const Encrypt = require('../../../src/lib/services/encrypt')

t.test('#run', ct => {
  const encrypt = new Encrypt()

  const envVault = encrypt.run()

  const expected = 'encrypted .env.vault file here'

  ct.equal(envVault, expected)

  ct.end()
})
