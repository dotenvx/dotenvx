const t = require('tap')

const environment = require('../../../../src/lib/helpers/envResolution/environment')

t.test('#environment (.env)', ct => {
  const filepath = '.env'
  const result = environment(filepath)

  ct.same(result, 'development')

  ct.end()
})

t.test('#environment (.env.production)', ct => {
  const filepath = '.env.production'
  const result = environment(filepath)

  ct.same(result, 'production')

  ct.end()
})

t.test('#environment (.ENV.PRODUCTION)', ct => {
  const filepath = '.ENV.PRODUCTION'
  const result = environment(filepath)

  ct.same(result, 'production')

  ct.end()
})

t.test('#environment (.env.local)', (ct) => {
  const filepath = '.env.local'
  const result = environment(filepath)

  ct.same(result, 'local')

  ct.end()
})

t.test('#environment (.env.development.local)', (ct) => {
  const filepath = '.env.development.local'
  const result = environment(filepath)

  ct.same(result, 'development_local')

  ct.end()
})

t.test('#environment (.env.development.production)', (ct) => {
  const filepath = '.env.development.production'
  const result = environment(filepath)

  ct.same(result, 'development_production')

  ct.end()
})

t.test('#environment (.env.some.other.thing)', (ct) => {
  const filepath = '.env.some.other.thing'
  const result = environment(filepath)

  ct.same(result, 'some_other')

  ct.end()
})

t.test('#environment (.env1)', ct => {
  const filepath = '.env1'
  const result = environment(filepath)

  ct.same(result, 'development1')

  ct.end()
})

t.test('#environment (secrets.txt)', ct => {
  const filepath = 'secrets.txt'
  const result = environment(filepath)

  ct.same(result, 'secrets.txt') // for now just return the filename (might change in the future depending on user usage)

  ct.end()
})
