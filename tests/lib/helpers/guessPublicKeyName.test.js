const t = require('tap')

const guessPublicKeyName = require('../../../src/lib/helpers/guessPublicKeyName')

t.test('#guessPublicKeyName (.env)', ct => {
  const filepath = '.env'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY')

  ct.end()
})

t.test('#guessPublicKeyName (.env)', ct => {
  const filepath = 'some/path/to/.env'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY')

  ct.end()
})

t.test('#guessPublicKeyName (.env.env)', ct => {
  const filepath = '.env.env'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_ENV')

  ct.end()
})

t.test('#guessPublicKeyName (.env.production)', ct => {
  const filepath = '.env.production'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_PRODUCTION')

  ct.end()
})

t.test('#guessPublicKeyName (.env.local)', (ct) => {
  const filepath = '.env.local'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_LOCAL')

  ct.end()
})

t.test('#guessPublicKeyName (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_DEVELOPMENT_LOCAL')

  ct.end()
})

t.test('#guessPublicKeyName (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_DEVELOPMENT_PRODUCTION')

  ct.end()
})

t.test('#guessPublicKeyName (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const result = guessPublicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_SOME_OTHER')

  ct.end()
})
