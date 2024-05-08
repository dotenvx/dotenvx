const t = require('tap')

const guessPrivateKeyName = require('../../../src/lib/helpers/guessPrivateKeyName')

t.test('#guessPrivateKeyName (.env)', ct => {
  const filepath = '.env'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY')

  ct.end()
})

t.test('#guessPrivateKeyName (.env)', ct => {
  const filepath = 'some/path/to/.env'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.env)', ct => {
  const filepath = '.env.env'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_ENV')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.production)', ct => {
  const filepath = '.env.production'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_PRODUCTION')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.local)', (ct) => {
  const filepath = '.env.local'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_LOCAL')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_DEVELOPMENT_PRODUCTION')

  ct.end()
})

t.test('#guessPrivateKeyName (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const result = guessPrivateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_SOME_OTHER')

  ct.end()
})
