const t = require('tap')
const keynames = require('../../../src/lib/conventions/keynames')

t.test('keynames returns base key names for .env', ct => {
  const result = keynames('.env')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })
  ct.end()
})

t.test('keynames returns environment key names for .env.production', ct => {
  const result = keynames('.env.production')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })
  ct.end()
})

t.test('keynames returns local environment key names', ct => {
  const result = keynames('.env.ci.local')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })
  ct.end()
})

t.test('keynames handles .env1', ct => {
  const result = keynames('.env1')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_DEVELOPMENT1',
    privateKeyName: 'DOTENV_PRIVATE_KEY_DEVELOPMENT1'
  })
  ct.end()
})

t.test('keynames truncates long environment suffixes', ct => {
  const result = keynames('.env.ci.local.extra')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_CI_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_CI_LOCAL'
  })
  ct.end()
})

t.test('keynames handles .env.txt', ct => {
  const result = keynames('.env.txt')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })
  ct.end()
})

t.test('keynames handles .env.production.txt', ct => {
  const result = keynames('.env.production.txt')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })
  ct.end()
})

t.test('keynames handles uppercase filenames', ct => {
  const result = keynames('.ENV.LOCAL')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_LOCAL'
  })
  ct.end()
})
