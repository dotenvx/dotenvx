const t = require('tap')

const conventions = require('../../../src/lib/helpers/conventions')

t.test('#conventions', ct => {
  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.development.local' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env.development' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#conventions (invalid)', ct => {
  try {
    conventions('invalid')

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_CONVENTION: \'invalid\'. permitted conventions: [\'nextjs\']')

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#conventions (process.env.NODE_ENV is test)', ct => {
  const originalNodeEnv = process.env.NODE_ENV

  process.env.NODE_ENV = 'test'

  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.test.local' },
    { type: 'envFile', value: '.env.test' },
    { type: 'envFile', value: '.env' }
  ])

  process.env.NODE_ENV = originalNodeEnv

  ct.end()
})

t.test('#conventions (process.env.NODE_ENV is unrecognized)', ct => {
  const originalNodeEnv = process.env.NODE_ENV

  process.env.NODE_ENV = 'unrecognized'

  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env' }
  ])

  process.env.NODE_ENV = originalNodeEnv

  ct.end()
})
