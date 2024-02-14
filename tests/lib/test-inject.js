const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.test('inject', ct => {
  const processEnv = {}
  const parsed = { HELLO: 'World' }

  const res = dotenvx.inject(processEnv, parsed)

  ct.deepEqual([...res.injected], ['HELLO'])
  ct.deepEqual([...res.preExisting], [])
  ct.equal(processEnv.HELLO, 'World')

  ct.end()
})

t.test('inject key already exists', ct => {
  const processEnv = { HELLO: 'exists' }
  const parsed = { HELLO: 'World' }

  const res = dotenvx.inject(processEnv, parsed)

  ct.deepEqual([...res.injected], [])
  ct.deepEqual([...res.preExisting], ['HELLO'])
  ct.equal(processEnv.HELLO, 'exists')

  ct.end()
})

t.test('inject key already exists with overload', ct => {
  const processEnv = { HELLO: 'exists' }
  const parsed = { HELLO: 'World' }
  const overload = true

  const res = dotenvx.inject(processEnv, parsed, overload)

  ct.deepEqual([...res.injected], ['HELLO'])
  ct.deepEqual([...res.preExisting], [])
  ct.equal(processEnv.HELLO, 'World')

  ct.end()
})

t.test('inject when parsed is not an object', ct => {
  const processEnv = { HELLO: 'exists' }
  const parsed = 'string'

  try {
    dotenvx.inject(processEnv, parsed)

    t.fail('inject should throw error')
  } catch (error) {
    t.pass(' threw an error')
    t.equal(error.message, 'OBJECT_REQUIRED: Please check the parsed argument being passed to inject')
  }

  ct.end()
})
