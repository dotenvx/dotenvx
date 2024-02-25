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
