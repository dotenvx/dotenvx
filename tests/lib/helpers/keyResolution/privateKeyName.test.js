const t = require('tap')

const privateKeyName = require('../../../../src/lib/helpers/keyResolution/privateKeyName')

t.test('#privateKeyName (.env)', ct => {
  const filepath = '.env'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY')

  ct.end()
})

t.test('#privateKeyName (.env)', ct => {
  const filepath = 'some/path/to/.env'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY')

  ct.end()
})

t.test('#privateKeyName (.env.env)', ct => {
  const filepath = '.env.env'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_ENV')

  ct.end()
})

t.test('#privateKeyName (.env.production)', ct => {
  const filepath = '.env.production'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_PRODUCTION')

  ct.end()
})

t.test('#privateKeyName (.env.local)', (ct) => {
  const filepath = '.env.local'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_LOCAL')

  ct.end()
})

t.test('#privateKeyName (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_DEVELOPMENT_LOCAL')

  ct.end()
})

t.test('#privateKeyName (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_DEVELOPMENT_PRODUCTION')

  ct.end()
})

t.test('#privateKeyName (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const result = privateKeyName(filepath)

  ct.same(result, 'DOTENV_PRIVATE_KEY_SOME_OTHER')

  ct.end()
})
