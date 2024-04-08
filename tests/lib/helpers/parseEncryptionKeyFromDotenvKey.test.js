const t = require('tap')

const parseEncryptionKeyFromDotenvKey = require('../../../src/lib/helpers/parseEncryptionKeyFromDotenvKey')

t.test('#parseEncryptionKeyFromDotenvKey', ct => {
  const dotenvKey = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=other'

  const key = parseEncryptionKeyFromDotenvKey(dotenvKey) // buffer hex
  const expected = Buffer.from('e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34', 'hex')

  ct.same(key, expected)

  ct.end()
})

t.test('#parseEncryptionKeyFromDotenvKey (not url parseable)', ct => {
  const dotenvKey = 'e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34'

  try {
    parseEncryptionKeyFromDotenvKey(dotenvKey) // buffer hex

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_DOTENV_KEY: Incomplete format. It should be a dotenv uri. (dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development)')

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#parseEncryptionKeyFromDotenvKey (missing key/password part)', ct => {
  const dotenvKey = 'dotenv://:@dotenvx.com/vault/.env.vault?environment=other'

  try {
    parseEncryptionKeyFromDotenvKey(dotenvKey) // buffer hex

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_DOTENV_KEY: Missing key part')

    ct.same(error, exampleError)
  }

  ct.end()
})
