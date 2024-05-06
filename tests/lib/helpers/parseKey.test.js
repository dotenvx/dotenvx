const t = require('tap')

const parseKey = require('../../../src/lib/helpers/parseKey')

let dotenvKey = 'dotenv://:02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498@dotenvx.com/publicKey?env-file=.env'

t.test('#parseKey', ct => {
  const {
    key,
    envFile
  } = parseKey(dotenvKey)

  ct.same(key, '02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498')
  ct.same(envFile, '.env')

  ct.end()
})

t.test('#parseKey invalid format', ct => {
  try {
    parseKey('not a url')
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'INVALID_DOTENV_KEY: Invalid URL')
  }

  ct.end()
})

t.test('#parseKey missing envfile', ct => {
  dotenvKey = 'dotenv://:02b106c30579baf896ae1fddf077cbcb4fef5e7d457932974878dcb51f42b45498@dotenvx.com/publicKey'

  try {
    parseKey(dotenvKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'INVALID_DOTENV_KEY: Missing url param env-file')
  }

  ct.end()
})

t.test('#parseKey missing key part', ct => {
  dotenvKey = 'dotenv://:@dotenvx.com/publicKey?env-file=.env'

  try {
    parseKey(dotenvKey)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'INVALID_DOTENV_KEY: Missing key part')
  }

  ct.end()
})
