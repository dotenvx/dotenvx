const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('expands', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC_EXPAND, 'basic')

  ct.equal(env.parsed.MACHINE_EXPAND, 'machine_env')
  ct.equal(process.env.MACHINE_EXPAND, 'machine_env')

  ct.end()
})

t.test('expands using the file value first (if it exists)', ct => {
  process.env.MACHINE = 'machine'

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.MACHINE_EXPAND, 'machine_env')
  ct.equal(process.env.MACHINE_EXPAND, 'machine_env')

  ct.end()
})

t.test('expands to bring own processEnv', ct => {
  const myObject = {}

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath, processEnv: myObject })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, undefined)
  ct.equal(myObject.BASIC, 'basic')

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC_EXPAND, undefined)
  ct.equal(myObject.BASIC_EXPAND, 'basic')

  ct.equal(env.parsed.MACHINE_EXPAND, 'machine_env')
  ct.equal(process.env.MACHINE_EXPAND, undefined)
  ct.equal(myObject.MACHINE_EXPAND, 'machine_env')

  ct.end()
})
