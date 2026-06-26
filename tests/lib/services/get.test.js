const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const actualEnvsResolver = require('../../../src/lib/resolvers/envs')
let envsResolverStub
const Get = proxyquire('../../../src/lib/services/get', {
  './../resolvers/envs': (...args) => envsResolverStub ? envsResolverStub(...args) : actualEnvsResolver(...args)
})

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  sinon.restore()
  envsResolverStub = null
})

t.test('#run (missing key returns the entire processEnv as object)',
  async ct => {
    const { parsed } = await new Get().run()

    ct.same(parsed, {})

    ct.end()
  })

t.test('#run forwards command metadata to envs resolver',
  async ct => {
    envsResolverStub = sinon.stub().resolves({ processedEnvs: [] })

    await new Get(null, [], false, false, null, false, {
      command: ['get', 'HELLO']
    }).run()

    ct.equal(envsResolverStub.callCount, 1)
    ct.same(envsResolverStub.firstCall.args[0].command, ['get', 'HELLO'])
    ct.end()
  })

t.test('#run (all object) with preset process.env',
  async ct => {
    process.env.PRESET_ENV_EXAMPLE = 'something/on/machine'

    const { parsed } = await new Get(null, [], false, true).run()
    ct.same(parsed, { PRESET_ENV_EXAMPLE: 'something/on/machine' })

    const result = await new Get(null, [], false, false).run()
    ct.same(result.parsed, {})

    ct.end()
  })

t.test('#run (missing key returns the entire processEnv as object)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.local' }
    ]
    const { parsed } = await new Get(null, envs).run()

    ct.same(parsed, { BASIC: 'local_basic', LOCAL: 'local' })

    ct.end()
  })

t.test('#run (missing key returns empty string when fetching single key)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.local' }
    ]
    const { parsed } = await new Get('BAZ', envs).run()

    ct.same(parsed.BAZ, undefined)

    ct.end()
  })

t.test('#run',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env' }
    ]
    const { parsed } = await new Get('BASIC', envs).run()

    ct.same(parsed.BASIC, 'basic')

    ct.end()
  })

t.test('#run (as multi-array)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env' },
      { type: 'envFile', value: 'tests/.env.local' }
    ]
    const { parsed } = await new Get('BASIC', envs).run()

    ct.same(parsed.BASIC, 'basic')

    ct.end()
  })

t.test('#run (as multi-array reversed (first wins))',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.local' },
      { type: 'envFile', value: 'tests/.env' }
    ]

    const { parsed } = await new Get('BASIC', envs).run()

    ct.same(parsed.BASIC, 'local_basic')

    ct.end()
  })

t.test('#run (as multi-array reversed with overload (second wins))',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.local' },
      { type: 'envFile', value: 'tests/.env' }
    ]

    const { parsed } = await new Get('BASIC', envs, true).run()

    ct.same(parsed.BASIC, 'basic')

    ct.end()
  })

t.test('#run (as multi-array - some not found)',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.notfound' },
      { type: 'envFile', value: 'tests/.env' }
    ]

    const { parsed } = await new Get('BASIC', envs, true).run()

    ct.same(parsed.BASIC, 'basic')

    ct.end()
  })

t.test('#run (process.env already exists on machine)',
  async ct => {
    process.env.BASIC = 'existing'

    const envs = [
      { type: 'envFile', value: 'tests/.env.local' }
    ]

    const { parsed } = await new Get('BASIC', envs).run()

    ct.same(parsed.BASIC, 'existing')

    ct.end()
  })

t.test('#run (no key and process.env already exists on machine)',
  async ct => {
    process.env.BASIC = 'existing'

    const envs = [
      { type: 'envFile', value: 'tests/.env.local' }
    ]

    const { parsed } = await new Get(null, envs).run()

    ct.same(parsed, { BASIC: 'existing', LOCAL: 'local' })

    ct.end()
  })

t.test('#run expansion',
  async ct => {
    const envs = [
      { type: 'envFile', value: 'tests/.env.expand' }
    ]

    const { parsed } = await new Get('BASIC_EXPAND', envs).run()

    ct.same(parsed.BASIC_EXPAND, 'basic')

    ct.end()
  })

t.test('#run passes noArmor to envs resolver',
  async ct => {
    envsResolverStub = sinon.stub().resolves({ processedEnvs: [] })

    await new Get('KEY').run()
    t.equal(envsResolverStub.firstCall.args[0].noArmor, false, 'noArmor defaults to false')

    envsResolverStub.resetHistory()
    await new Get('KEY', [], false, false, null, true).run()
    t.equal(envsResolverStub.firstCall.args[0].noArmor, true, 'noArmor true when provided')

    ct.end()
  })
