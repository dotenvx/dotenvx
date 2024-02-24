const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const RunVault = require('../../../src/lib/services/runVault')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)', ct => {
  try {
    new RunVault().run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('dude')
    exampleError.message = `you set DOTENV_KEY but your .env.vault file is missing: ${path.resolve('.env.vault')}`
    exampleError.code = 'MISSING_ENV_VAULT_FILE'

    ct.same(error, exampleError)
  }

  ct.end()
})
