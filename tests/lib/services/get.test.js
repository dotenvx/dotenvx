const t = require('tap')

const Get = require('../../../src/lib/services/get')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (missing key returns the entire processEnv as object)', ct => {
  const { parsed } = new Get().run()

  ct.same(parsed, {})

  ct.end()
})

t.test('#run (all object) with preset process.env', ct => {
  process.env.PRESET_ENV_EXAMPLE = 'something/on/machine'

  const { parsed } = new Get(null, [], false, [], '', true).run()
  ct.same(parsed, { PRESET_ENV_EXAMPLE: 'something/on/machine' })

  const result = new Get(null, [], false, [], '', false).run()
  ct.same(result.parsed, {})

  ct.end()
})

t.test('#run (missing key returns the entire processEnv as object)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const { parsed } = new Get(null, envs).run()

  ct.same(parsed, { BASIC: 'local_basic', LOCAL: 'local' })

  ct.end()
})

t.test('#run (missing key returns empty string when fetching single key)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const { parsed } = new Get('BAZ', envs).run()

  ct.same(parsed.BAZ, undefined)

  ct.end()
})

t.test('#run', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env' }
  ]
  const { parsed } = new Get('BASIC', envs).run()

  ct.same(parsed.BASIC, 'basic')

  ct.end()
})

t.test('#run (as multi-array)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env' },
    { type: 'envFile', value: 'tests/.env.local' }
  ]
  const { parsed } = new Get('BASIC', envs).run()

  ct.same(parsed.BASIC, 'basic')

  ct.end()
})

t.test('#run (as multi-array reversed (first wins))', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const { parsed } = new Get('BASIC', envs).run()

  ct.same(parsed.BASIC, 'local_basic')

  ct.end()
})

t.test('#run (as multi-array reversed with overload (second wins))', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.local' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const { parsed } = new Get('BASIC', envs, true).run()

  ct.same(parsed.BASIC, 'basic')

  ct.end()
})

t.test('#run (as multi-array - some not found)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.notfound' },
    { type: 'envFile', value: 'tests/.env' }
  ]

  const { parsed } = new Get('BASIC', envs, true).run()

  ct.same(parsed.BASIC, 'basic')

  ct.end()
})

t.test('#run (process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]

  const { parsed } = new Get('BASIC', envs).run()

  ct.same(parsed.BASIC, 'existing')

  ct.end()
})

t.test('#run (no key and process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const envs = [
    { type: 'envFile', value: 'tests/.env.local' }
  ]

  const { parsed } = new Get(null, envs).run()

  ct.same(parsed, { BASIC: 'existing', LOCAL: 'local' })

  ct.end()
})

t.test('#run expansion', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.expand' }
  ]

  const { parsed } = new Get('BASIC_EXPAND', envs).run()

  ct.same(parsed.BASIC_EXPAND, 'basic')

  ct.end()
})
