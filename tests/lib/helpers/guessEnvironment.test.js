const t = require('tap')

const guessEnvironment = require('../../../src/lib/helpers/guessEnvironment')

t.test('#guessEnvironment (.env)', ct => {
  const filepath = '.env'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'development')

  ct.end()
})

t.test('#guessEnvironment (.env.production)', ct => {
  const filepath = '.env.production'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'production')

  ct.end()
})

t.test('#guessEnvironment (.env.local)', (ct) => {
  const filepath = '.env.local'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'local')

  ct.end()
})

t.test('#guessEnvironment (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'development_local')

  ct.end()
})

t.test('#guessEnvironment (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'development_production')

  ct.end()
})

t.test('#guessEnvironment (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'some_other')

  ct.end()
})

t.test('#guessEnvironment (.env1)', ct => {
  const filepath = '.env1'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'development1')

  ct.end()
})

t.test('#guessEnvironment (secrets.txt)', ct => {
  const filepath = 'secrets.txt'
  const environment = guessEnvironment(filepath)

  ct.same(environment, 'secrets.txt') // for now just return the filename (might change in the future depending on user usage)

  ct.end()
})
