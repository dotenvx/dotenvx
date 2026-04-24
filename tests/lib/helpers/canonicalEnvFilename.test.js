const t = require('tap')

const canonicalEnvFilename = require('../../../src/lib/helpers/canonicalEnvFilename')

t.test('#canonicalEnvFilename (.env)', ct => {
  const result = canonicalEnvFilename('.env')

  ct.same(result, '.env')

  ct.end()
})

t.test('#canonicalEnvFilename (.env.txt)', ct => {
  const result = canonicalEnvFilename('.env.txt')

  ct.same(result, '.env')

  ct.end()
})

t.test('#canonicalEnvFilename (.env.production.txt)', ct => {
  const result = canonicalEnvFilename('.env.production.txt')

  ct.same(result, '.env.production')

  ct.end()
})

t.test('#canonicalEnvFilename (.ENV.LOCAL.TXT)', ct => {
  const result = canonicalEnvFilename('.ENV.LOCAL.TXT')

  ct.same(result, '.env.local')

  ct.end()
})

t.test('#canonicalEnvFilename (secrets.txt)', ct => {
  const result = canonicalEnvFilename('secrets.txt')

  ct.same(result, 'secrets.txt')

  ct.end()
})
