const t = require('tap')

const extractUsernameName = require('../../../src/lib/helpers/extractUsernameName')

t.test('#extractUsernameName', ct => {
  const result = extractUsernameName('https://github.com/motdotla/dotenv')

  ct.same(result, 'motdotla/dotenv')

  ct.end()
})
