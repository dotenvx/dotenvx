const t = require('tap')

const guessKeyNames = require('../../../../src/lib/helpers/keyResolution/guessKeyNames')

t.test('#guessKeyNames (.env)', ct => {
  const result = guessKeyNames('.env')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY',
    privateKeyName: 'DOTENV_PRIVATE_KEY'
  })

  ct.end()
})

t.test('#guessKeyNames (.env.production)', ct => {
  const result = guessKeyNames('.env.production')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_PRODUCTION',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION'
  })

  ct.end()
})

t.test('#guessKeyNames (.ENV.LOCAL)', ct => {
  const result = guessKeyNames('.ENV.LOCAL')

  ct.same(result, {
    publicKeyName: 'DOTENV_PUBLIC_KEY_LOCAL',
    privateKeyName: 'DOTENV_PRIVATE_KEY_LOCAL'
  })

  ct.end()
})
