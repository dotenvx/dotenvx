const t = require('tap')

const conventions = require('../../../src/lib/helpers/conventions')

t.test('#conventions', ct => {
  try {
    conventions()

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_CONVENTION: \'undefined\'. permitted conventions: [\'nextjs\', \'mono\']')

    ct.same(error, exampleError)
  }

  ct.end()
})

t.test('#conventions (nextjs)', ct => {
  const envs = conventions('nextjs')

  ct.same(envs, [
    { type: 'envFile', value: '.env.development.local' },
    { type: 'envFile', value: '.env.local' },
    { type: 'envFile', value: '.env.development' },
    { type: 'envFile', value: '.env' }
  ])

  ct.end()
})

t.test('#conventions (mono)', ct => {
  const envs = conventions('mono')

  ct.same(envs, [
    { type: 'envFile', value: './../../.env' },
    { type: 'envFile', value: './../../.env.local' },
    { type: 'envFile', value: './../../.env.development' },
    { type: 'envFile', value: './../../.env.development.local' },
    { type: 'envFile', value: './../.env' },
    { type: 'envFile', value: './../.env.local' },
    { type: 'envFile', value: './../.env.development' },
    { type: 'envFile', value: './../.env.development.local' },
    { type: 'envFile', value: './.env' },
    { type: 'envFile', value: './.env.local' },
    { type: 'envFile', value: './.env.development' },
    { type: 'envFile', value: './.env.development.local' }
  ])

  ct.end()
})

t.test('#conventions (invalid)', ct => {
  try {
    conventions('invalid')

    ct.fail('should have raised an error but did not')
  } catch (error) {
    const exampleError = new Error('INVALID_CONVENTION: \'invalid\'. permitted conventions: [\'nextjs\', \'mono\']')

    ct.same(error, exampleError)
  }

  ct.end()
})
