const t = require('tap')

const conventions = require('../../../src/lib/helpers/conventions')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

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

t.test('#conventions flow', ct => {
  const envs = conventions('flow')

  ct.same(envs, [
    { type: 'envFile', value: '.env.development.local' },
    { type: 'envFile', value: '.env.development' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env' },
    { type: 'envFile', value: '.env.defaults' }
  ])

  ct.end()
})

t.test('#conventions (invalid)', ct => {
  try {
    conventions('invalid')

    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.message, '[INVALID_CONVENTION] invalid convention (invalid)')
    ct.equal(error.code, 'INVALID_CONVENTION')
    ct.equal(error.help, 'fix: [https://github.com/dotenvx/dotenvx/issues/761]')
  }

  ct.end()
})

t.test('#conventions (process.env.NODE_ENV is test)', ct => {
  process.env.NODE_ENV = 'test'

  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.test.local' },
    { type: 'envFile', value: '.env.test' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#conventions (process.env.DOTENV_ENV is test)', ct => {
  process.env.DOTENV_ENV = 'test'

  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.test.local' },
    { type: 'envFile', value: '.env.test' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#conventions flow (process.env.NODE_ENV is test)', ct => {
  process.env.NODE_ENV = 'test'

  const envs = conventions('flow')

  ct.same(envs, [
    { type: 'envFile', value: '.env.test.local' },
    { type: 'envFile', value: '.env.test' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env' },
    { type: 'envFile', value: '.env.defaults' }
  ])

  ct.end()
})

t.test('#conventions (process.env.NODE_ENV is unrecognized)', ct => {
  process.env.NODE_ENV = 'unrecognized'

  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#conventions flow (process.env.NODE_ENV is unrecognized)', ct => {
  process.env.NODE_ENV = 'unrecognized'

  const envs = conventions('flow')

  ct.same(envs, [
    { type: 'envFile', value: '.env.unrecognized.local' },
    { type: 'envFile', value: '.env.unrecognized' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env' },
    { type: 'envFile', value: '.env.defaults' }
  ])

  ct.end()
})
