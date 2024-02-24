const t = require('tap')

const parseEnvironmentFromDotenvKey = require('../../../src/lib/helpers/parseEnvironmentFromDotenvKey')

t.test('#parseEnvironmentFromDotenvKey', ct => {
  const dotenvKey = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment=development'

  const environment = parseEnvironmentFromDotenvKey(dotenvKey)

  ct.same(environment, 'development')

  ct.end()
})

t.test('#parseEnvironmentFromDotenvKey (not url parseable)', ct => {
  const dotenvKey = 'e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34'

  try {
    parseEnvironmentFromDotenvKey(dotenvKey)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_DOTENV_KEY: Invalid URL')

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#parseEnvironmentFromDotenvKey (missing environment part)', ct => {
  const dotenvKey = 'dotenv://:key_e9e9ef8665b828cf2b64b2bf4237876b9a866da6580777633fba4325648cdd34@dotenvx.com/vault/.env.vault?environment='

  try {
    parseEnvironmentFromDotenvKey(dotenvKey)

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_DOTENV_KEY: Missing environment part')

    ct.same(error, exampleError)
  }

  ct.end()
})
