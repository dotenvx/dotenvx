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

  const json = new Get(null, null, false, true).run()
  ct.same(json, { PRESET_ENV_EXAMPLE: 'something/on/machine' })

  const json2 = new Get(null, null, false, false).run()
  ct.same(json2, {})

  ct.end()
})

t.test('#run (missing key returns the entire processEnv as object)', ct => {
  const json = new Get(null, 'tests/.env.local').run()

  ct.same(json, { BASIC: 'local_basic', LOCAL: 'local' })

  ct.end()
})

t.test('#run', ct => {
  const value = new Get('BASIC', 'tests/.env').run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as array)', ct => {
  const value = new Get('BASIC', ['tests/.env']).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array)', ct => {
  const value = new Get('BASIC', ['tests/.env', 'tests/.env.local']).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array reversed (first wins))', ct => {
  const value = new Get('BASIC', ['tests/.env.local', 'tests/.env']).run()

  ct.same(value, 'local_basic')

  ct.end()
})

t.test('#run (as multi-array reversed with overload (second wins))', ct => {
  const value = new Get('BASIC', ['tests/.env.local', 'tests/.env'], true).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (as multi-array - some not found)', ct => {
  const value = new Get('BASIC', ['tests/.env.notfound', 'tests/.env'], true).run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run (process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const value = new Get('BASIC', 'tests/.env.local').run()

  ct.same(value, 'existing')

  ct.end()
})

t.test('#run (no key and process.env already exists on machine)', ct => {
  process.env.BASIC = 'existing'

  const json = new Get(null, 'tests/.env.local').run()

  ct.same(json, { BASIC: 'existing', LOCAL: 'local' })

  ct.end()
})

t.test('#run expansion', ct => {
  const value = new Get('BASIC_EXPAND', 'tests/.env.expand').run()

  ct.same(value, 'basic')

  ct.end()
})

t.test('#run expansion with pre-existing', ct => {
  process.env.BASIC = 'existing'

  const value = new Get('BASIC_EXPAND', 'tests/.env.expand').run()

  ct.same(value, 'existing')

  ct.end()
})

t.test('#run does not expand something from process.env that looks expandable', ct => {
  process.env.BASIC = 'existing'
  process.env.LOOKS_EXPANDABLE = '$basic' // not expandable because is already on machine with this value. common scenario are pas$words.

  const value = new Get('BASIC_EXPAND', 'tests/.env.expand').run()
  ct.same(value, 'existing')

  const value2 = new Get('LOOKS_EXPANDABLE', 'tests/.env.expand').run()
  ct.same(value2, '$basic')

  ct.end()
})
