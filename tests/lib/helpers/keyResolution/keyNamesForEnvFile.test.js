const t = require('tap')

const keyNamesForEnvFile = require('../../../../src/lib/helpers/keyResolution/keyNamesForEnvFile')

t.test('#keyNamesForEnvFile (.env)', ct => {
  const result = keyNamesForEnvFile('.env')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.env.production)', ct => {
  const result = keyNamesForEnvFile('.env.production')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.env.ci.local)', ct => {
  const result = keyNamesForEnvFile('.env.ci.local')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.env1)', ct => {
  const result = keyNamesForEnvFile('.env1')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_DEVELOPMENT1',
    privateKeyName: 'DOTENV_PRIVATE_KEY_DEVELOPMENT1'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile truncates long environment suffixes', ct => {
  const result = keyNamesForEnvFile('.env.ci.local.extra')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.env.txt)', ct => {
  const result = keyNamesForEnvFile('.env.txt')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.env.production.txt)', ct => {
  const result = keyNamesForEnvFile('.env.production.txt')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })

  ct.end()
})

t.test('#keyNamesForEnvFile (.ENV.LOCAL)', ct => {
  const result = keyNamesForEnvFile('.ENV.LOCAL')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_LOCAL'
  })

  ct.end()
})
