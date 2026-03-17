const t = require('tap')

const keyNames = require('../../../../src/lib/helpers/keyResolution/keyNames')

t.test('#keyNames (.env)', ct => {
  const result = keyNames('.env')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })

  ct.end()
})

t.test('#keyNames (.env.production)', ct => {
  const result = keyNames('.env.production')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })

  ct.end()
})

t.test('#keyNames (.ENV.LOCAL)', ct => {
  const result = keyNames('.ENV.LOCAL')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_LOCAL'
  })

  ct.end()
})
