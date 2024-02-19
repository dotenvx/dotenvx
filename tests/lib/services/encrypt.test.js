const t = require('tap')

const Encrypt = require('../../../src/lib/services/encrypt')

t.test('#run', ct => {
  const encrypt = new Encrypt()

  const { envKeys, envVault } = encrypt.run()

  ct.equal(envKeys, 'todo')
  ct.equal(envVault, 'todo')

  ct.end()
})
