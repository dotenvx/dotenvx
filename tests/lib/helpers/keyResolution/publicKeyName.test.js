const t = require('tap')

const publicKeyName = require('../../../../src/lib/helpers/keyResolution/publicKeyName')

t.test('#publicKeyName (.env)', ct => {
  const filepath = '.env'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY')

  ct.end()
})

t.test('#publicKeyName (.env)', ct => {
  const filepath = 'some/path/to/.env'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY')

  ct.end()
})

t.test('#publicKeyName (.env.env)', ct => {
  const filepath = '.env.env'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_ENV')

  ct.end()
})

t.test('#publicKeyName (.env.production)', ct => {
  const filepath = '.env.production'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_PRODUCTION')

  ct.end()
})

t.test('#publicKeyName (.env.local)', (ct) => {
  const filepath = '.env.local'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_LOCAL')

  ct.end()
})

t.test('#publicKeyName (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_DEVELOPMENT_LOCAL')

  ct.end()
})

t.test('#publicKeyName (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_DEVELOPMENT_PRODUCTION')

  ct.end()
})

t.test('#publicKeyName (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const result = publicKeyName(filepath)

  ct.same(result, 'DOTENV_PUBLIC_KEY_SOME_OTHER')

  ct.end()
})
