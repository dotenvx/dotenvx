const t = require('tap')
const path = require('path')

const Encrypt = require('../../../src/lib/services/encrypt')

t.test('#run', ct => {
  const {
    dotenvKeys,
    dotenvKeysFile,
    addedKeys,
    existingKeys,
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = new Encrypt('tests/monorepo/apps/backend', ['.env']).run()

  const expectedDotenvKeysFile = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/
DOTENV_KEY_DEVELOPMENT="dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development"
`

  const expectedDotenvVaultFile = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/

# development
DOTENV_VAULT_DEVELOPMENT="TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u"

`

  ct.same(dotenvKeys, { DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development' })
  ct.same(dotenvKeysFile, expectedDotenvKeysFile)
  ct.same(addedKeys, [])
  ct.same(existingKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(dotenvVaultFile, expectedDotenvVaultFile)
  ct.same(addedVaults, [])
  ct.same(existingVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(addedDotenvFilenames, [])

  ct.end()
})

t.test('#run (when no .env.vault or .env.keys yet)', ct => {
  const {
    addedKeys,
    existingKeys,
    addedVaults,
    existingVaults,
    addedDotenvFilenames
  } = new Encrypt('tests/monorepo/apps/frontend', ['.env']).run()

  ct.same(addedKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(existingKeys, [])
  ct.same(addedVaults, ['DOTENV_VAULT_DEVELOPMENT'])
  ct.same(existingVaults, [])
  ct.same(addedDotenvFilenames, ['.env'])

  ct.end()
})

t.test('#run (.env as string)', ct => {
  const {
    dotenvKeys,
    dotenvKeysFile,
    addedKeys,
    existingKeys
  } = new Encrypt('tests/monorepo/apps/backend', '.env').run()

  const expectedDotenvKeysFile = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/
DOTENV_KEY_DEVELOPMENT="dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development"
`

  ct.same(dotenvKeys, { DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development' })
  ct.same(dotenvKeysFile, expectedDotenvKeysFile)
  ct.same(addedKeys, [])
  ct.same(existingKeys, ['DOTENV_KEY_DEVELOPMENT'])

  ct.end()
})

t.test('#run (non-existant directory)', ct => {
  try {
    new Encrypt('tests/monorepo/apps/backendzzzz').run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'MISSING_DIRECTORY')
    ct.same(error.message, 'missing directory (tests/monorepo/apps/backendzzzz)')
  }

  ct.end()
})

t.test('#run (empty envFile)', ct => {
  try {
    new Encrypt('tests/monorepo/apps/backend', []).run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'MISSING_ENV_FILES')
    ct.same(error.message, 'no .env* files found')
    ct.same(error.help, '? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]')
  }

  ct.end()
})

t.test('#run (envFile not found)', ct => {
  try {
    new Encrypt('tests/monorepo/apps/backend', ['.env.notfound']).run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'MISSING_ENV_FILE')
    ct.same(error.message, `file does not exist at [${path.resolve('tests/monorepo/apps/backend/.env.notfound')}]`)
    ct.same(error.help, '? add it with [echo "HELLO=World" > .env.notfound] and then run [dotenvx encrypt]')
  }

  ct.end()
})

t.test('#_parsedDotenvKeys (returns empty when no keys file)', ct => {
  const encrypt = new Encrypt()
  const parsed = encrypt._parsedDotenvKeys()

  ct.same(parsed, {})

  ct.end()
})

t.test('#_parsedDotenvKeys (returns parsed keys file when directory passed containing .env.keys file)', ct => {
  const directory = 'tests/monorepo/apps/backend'
  const dotenvKeys = new Encrypt(directory)
  const parsed = dotenvKeys._parsedDotenvKeys()

  const output = {
    DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  }

  ct.same(parsed, output)

  ct.end()
})

t.test('#_parsedDotenvVault (returns empty when no vault file)', ct => {
  const encrypt = new Encrypt()
  const parsed = encrypt._parsedDotenvVault()

  ct.same(parsed, {})

  ct.end()
})

t.test('#_parsedDotenvVault (returns parsed vaults when directory passed contains .env.vault)', ct => {
  const encrypt = new Encrypt('tests/monorepo/apps/backend')
  const parsed = encrypt._parsedDotenvVault()

  ct.same(parsed, { DOTENV_VAULT_DEVELOPMENT: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u' })

  ct.end()
})
