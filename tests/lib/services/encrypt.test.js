const t = require('tap')
const path = require('path')
const sinon = require('sinon')

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
    addedDotenvFilepaths
  } = new Encrypt('tests/monorepo-example/apps/backend', ['.env']).run()

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

t.test('#run (.env as string)', ct => {
  const {
    dotenvKeys,
    dotenvKeysFile,
    addedKeys,
    existingKeys,
    dotenvVaultFile,
    addedVaults,
    existingVaults,
    addedDotenvFilepaths
  } = new Encrypt('tests/monorepo-example/apps/backend', '.env').run()

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

t.test('#run (empty envFile)', ct => {
  try {
    new Encrypt('tests/monorepo-example/apps/backend', []).run()
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
    new Encrypt('tests/monorepo-example/apps/backend', ['.env.notfound']).run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'MISSING_ENV_FILE')
    ct.same(error.message, `file does not exist at [${path.resolve('tests/monorepo-example/apps/backend/.env.notfound')}]`)
    ct.same(error.help, '? add it with [echo "HELLO=World" > .env.notfound] and then run [dotenvx encrypt]')
  }

  ct.end()
})


// t.test('#run (filepath does not exist)', ct => {
//   const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false)
//
//   try {
//     new DotenvKeys().run()
//
//     ct.fail('should have raised an error but did not')
//   } catch (error) {
//     ct.same(error.code, 'DOTENV_FILE_DOES_NOT_EXIST')
//     ct.same(error.message, `file does not exist at [${path.resolve('.env')}]`)
//     ct.same(error.help, '? add it with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]')
//   }
//
//   existsSyncStub.restore()
//
//   ct.end()
// })
//
// t.test('#run (envFile empty array)', ct => {
//   const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
//
//   try {
//     new DotenvKeys(undefined, []).run()
//
//     ct.fail('should have raised an error but did not')
//   } catch (error) {
//     ct.same(error.code, 'DOTENV_MISSING_ENV_FILE')
//     ct.same(error.message, 'no .env* files found')
//     ct.same(error.help, '? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]')
//   }
//
//   existsSyncStub.restore()
//
//   ct.end()
// })
//

t.test('#_parsedDotenvKeys (returns empty when no keys file)', ct => {
  const encrypt = new Encrypt()
  const parsed = encrypt._parsedDotenvKeys()

  ct.same(parsed, {})

  ct.end()
})

t.test('#_parsedDotenvKeys (returns parsed keys file when directory passed containing .env.keys file)', ct => {
  const directory = 'tests/monorepo-example/apps/backend'
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
  const encrypt = new Encrypt('tests/monorepo-example/apps/backend')
  const parsed = encrypt._parsedDotenvVault()

  ct.same(parsed, { DOTENV_VAULT_DEVELOPMENT: 'TgaIyXmiLS1ej5LrII+Boz8R8nQ4avEM/pcreOfLUehTMmludeyXn6HMXLu8Jjn9O0yckjXy7kRrNfUvUJ88V8RpTwDP8k7u' })

  ct.end()
})
