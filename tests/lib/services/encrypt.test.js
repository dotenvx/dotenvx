const t = require('tap')
const sinon = require('sinon')
const DotenvKeys = require('../../../src/lib/helpers/dotenvKeys')

const Encrypt = require('../../../src/lib/services/encrypt')

t.test('#run', ct => {
  dotenvKeysRunStub = sinon.stub(DotenvKeys.prototype, 'run')
  dotenvKeysRunStub.returns({ envKeys: '<.env.keys content>', addedKeys: ['DOTENV_KEY_DEVELOPMENT'], existingKeys: [] })

  const { envKeys, addedKeys, existingKeys, envVault } = new Encrypt().run()

  ct.same(envKeys, '<.env.keys content>')
  ct.same(addedKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(existingKeys, [])

  dotenvKeysRunStub.restore()

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


