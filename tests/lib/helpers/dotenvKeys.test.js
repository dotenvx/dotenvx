const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const crypto = require('crypto')

const DotenvKeys = require('../../../src/lib/helpers/dotenvKeys')

t.test('#run', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true)
  const randomBytesStub = sinon.stub(crypto, 'randomBytes')
  const fakeRandomValue = 'ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20'
  randomBytesStub.returns(Buffer.from(fakeRandomValue, 'hex'))

  const { envKeys, addedKeys, existingKeys } = new DotenvKeys().run()

  const expectedEnvKeys = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/
DOTENV_KEY_DEVELOPMENT="dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=development"
`

  ct.same(envKeys, expectedEnvKeys)
  ct.same(addedKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(existingKeys, [])

  existsSyncStub.restore()
  randomBytesStub.restore()

  ct.end()
})

t.test('#run (filepath does not exist)', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync').returns(false)

  try {
    new DotenvKeys().run()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.code, 'DOTENV_FILE_DOES_NOT_EXIST')
    ct.same(error.message, `file does not exist at [${path.resolve('.env')}]`)
    ct.same(error.help, '? add it with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]')
  }

  existsSyncStub.restore()

  ct.end()
})

t.test('#run (.env.keys file already had that DOTENV_KEY_environment)', ct => {
  const directory = 'tests/monorepo-example/apps/backend'
  const { envKeys, addedKeys, existingKeys } = new DotenvKeys(directory).run()

  const expectedEnvKeys = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenvx.com/env-keys)   /
#/--------------------------------------------------/
DOTENV_KEY_DEVELOPMENT="dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development"
`

  ct.same(envKeys, expectedEnvKeys)
  ct.same(addedKeys, [])
  ct.same(existingKeys, ['DOTENV_KEY_DEVELOPMENT'])

  ct.end()
})

t.test('#_parsedDotenvKeys (returns empty when no keys file)', ct => {
  const dotenvKeys = new DotenvKeys()
  const parsed = dotenvKeys._parsedDotenvKeys()

  ct.same(parsed, {})

  ct.end()
})

t.test('#_parsedDotenvKeys (returns parsed keys file when directory passed containing .env.keys file)', ct => {
  const directory = 'tests/monorepo-example/apps/backend'
  const dotenvKeys = new DotenvKeys(directory)
  const parsed = dotenvKeys._parsedDotenvKeys()

  const output = {
    DOTENV_KEY_DEVELOPMENT: 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'
  }

  ct.same(parsed, output)

  ct.end()
})

t.test('#_guessEnvironment (.env)', ct => {
  const dotenvKeys = new DotenvKeys()
  const filepath = '.env'
  const environment = dotenvKeys._guessEnvironment(filepath)

  ct.same(environment, 'development')

  ct.end()
})

t.test('#_guessEnvironment (.env.production)', ct => {
  const dotenvKeys = new DotenvKeys()
  const filepath = '.env.production'
  const environment = dotenvKeys._guessEnvironment(filepath)

  ct.same(environment, 'production')

  ct.end()
})

t.test('#_generateDotenvKey (production)', ct => {
  const dotenvKeys = new DotenvKeys()
  const environment = 'production'

  const randomBytesStub = sinon.stub(crypto, 'randomBytes')
  const fakeRandomValue = 'ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20'
  randomBytesStub.returns(Buffer.from(fakeRandomValue, 'hex'))

  const dotenvKey = dotenvKeys._generateDotenvKey(environment)

  ct.same(dotenvKey, 'dotenv://:key_ac300a21c59058c422c18dba8dc9892a537a63e156af14b5c5ef14810dc71f20@dotenvx.com/vault/.env.vault?environment=production')

  randomBytesStub.restore()

  ct.end()
})
