const t = require('tap')

const Get = require('../../../src/lib/services/get')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (missing key returns the entire processEnv as object)', ct => {
  const json = new Get().run()

  ct.same(json, {})

  ct.end()
})

t.test('#run (all object) with preset process.env', ct => {
  process.env.PRESET_ENV_EXAMPLE = 'something/on/machine'

  const json = new Get(null, [], false, '', true).run()
  ct.same(json, { PRESET_ENV_EXAMPLE: 'something/on/machine' })

  const json2 = new Get(null, [], false, '', false).run()
  ct.same(json2, {})

  ct.end()
})

t.test('#run (missing key returns the entire processEnv as object)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const json = new Get(null, envs).run()

  ct.same(json, { BASIC: 'local_basic', LOCAL: 'local' })

  ct.end()
})

t.test('#run (missing key returns empty string when fetching single key)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const value = new Get('BAZ', envs).run()

  ct.same(value, undefined)

  ct.end()
})

t.test('#run', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env' }
  ]
  const value = new Get('BASIC', envs).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env' },
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const value = new Get('BASIC', envs).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array reversed (first wins))', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const value = new Get('BASIC', envs).run()

  ct.same(value, 'local_basic')

  ct.end()
})

t.test('#run (as multi-array reversed with overload (second wins))', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const value = new Get('BASIC', envs, true).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array - some not found)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.notfound' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const value = new Get('BASIC', envs, true).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]

  const value = new Get('BASIC', envs).run()

  ct.same(value, 'existing')

  ct.end()
})

t.test('#run (no key and process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]

  const json = new Get(null, envs).run()

  ct.same(json, { BASIC: 'existing', LOCAL: 'local' })

  ct.end()
})

t.test('#run expansion', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.expand' }
  ]

  const value = new Get('BASIC_EXPAND', envs).run()

  ct.same(value, 'basic')

  ct.end()
})
