const t = require('tap')
const fs = require('fs')
const path = require('path')

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
    const exampleError = new Error(`you set DOTENV_KEY but your .env.vault file is missing: ${path.resolve('.env.vault')}`)
    exampleError.code = 'MISSING_ENV_VAULT_FILE'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#run (no DOTENV_KEY argument)', ct => {
  try {
    new RunVault('tests/monorepo/apps/backend/.env.vault').run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error(`your DOTENV_KEY appears to be blank: ''`)
    exampleError.code = 'MISSING_DOTENV_KEY'

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#run (.env.vault and DOTENV_KEY)', ct => {
  const filepath = 'tests/monorepo/apps/backend/.env.vault'
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const {
    envVaultFile,
    dotenvKeys,
    uniqueInjectedKeys
  } = new RunVault(filepath, DOTENV_KEY).run()

  ct.same(envVaultFile, filepath)
  ct.same(dotenvKeys, [DOTENV_KEY])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})


t.test('#_dotenvKeys', ct => {
  const DOTENV_KEY = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const runVault = new RunVault('tests/monorepo/apps/backend/.env.vault', DOTENV_KEY)

  const results = runVault._dotenvKeys()

  ct.same(results, [DOTENV_KEY])

  ct.end()
})

t.test('#_dotenvKeys (separated by comma)', ct => {
  const DOTENV_KEY = 'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development,dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const runVault = new RunVault('tests/monorepo/apps/backend/.env.vault', DOTENV_KEY)

  const results = runVault._dotenvKeys()

  ct.same(results, [
    'dotenv://:key_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@dotenvx.com/vault/.env.vault?environment=development',
    'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  ])

  ct.end()
})

t.test('#_dotenvKeys (undefined)', ct => {
  const runVault = new RunVault('tests/monorepo/apps/backend/.env.vault')

  const results = runVault._dotenvKeys()

  ct.same(results, [''])

  ct.end()
})

t.test('#_decrypted', ct => {
  const dotenvKey = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  const envVaultFile = 'tests/monorepo/apps/backend/.env.vault'
  const filepath = path.resolve(envVaultFile)

  const runVault = new RunVault(envVaultFile, dotenvKey)
  const parsedVault = runVault._parsedVault(filepath)

  const decrypted = runVault._decrypted(dotenvKey, parsedVault)

  const expected = `# for testing purposes only
HELLO="backend"
`
  ct.same(decrypted, expected)

  ct.end()
})

t.test('#_decrypted (can\'t find environment)', ct => {
  const dotenvKey = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=other'
  const envVaultFile = 'tests/monorepo/apps/backend/.env.vault'
  const filepath = path.resolve(envVaultFile)

  const runVault = new RunVault(envVaultFile, dotenvKey)
  const parsedVault = runVault._parsedVault(filepath)

  try {
    runVault._decrypted(dotenvKey, parsedVault)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: cannot locate environment DOTENV_VAULT_OTHER in your .env.vault file`)
    exampleError.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'

    ct.same(error, exampleError)
  }

  ct.end()
})
