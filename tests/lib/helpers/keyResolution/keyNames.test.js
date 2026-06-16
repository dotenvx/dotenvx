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

t.test('#keyNames (.env.ci.local)', ct => {
  const result = keyNames('.env.ci.local')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })

  ct.end()
})

t.test('#keyNames (.env1)', ct => {
  const result = keyNames('.env1')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_DEVELOPMENT1',
    privateKeyName: 'DOTENV_PRIVATE_KEY_DEVELOPMENT1'
  })

  ct.end()
})

t.test('#keyNames truncates long environment suffixes', ct => {
  const result = keyNames('.env.ci.local.extra')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })

  ct.end()
})

t.test('#keyNames (.env.txt)', ct => {
  const result = keyNames('.env.txt')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })

  ct.end()
})

t.test('#keyNames (.env.production.txt)', ct => {
  const result = keyNames('.env.production.txt')

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
