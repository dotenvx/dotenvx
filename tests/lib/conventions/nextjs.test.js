const t = require('tap')

const nextjs = require('../../../src/lib/conventions/nextjs')

t.test('#nextjs', ct => {
  const envs = nextjs()

  ct.same(envs, [
    { type: 'envFile', value: '.env.development.local' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env.development' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#nextjs (process.env.NODE_ENV is test)', ct => {
  const originalNodeEnv = process.env.NODE_ENV

  process.env.NODE_ENV = 'test'

  const envs = nextjs()

  ct.same(envs, [
    { type: 'envFile', value: '.env.test.local' },
    { type: 'envFile', value: '.env.test' },
    { type: 'envFile', value: '.env' }
  ])

  process.env.NODE_ENV = originalNodeEnv

  ct.end()
})
