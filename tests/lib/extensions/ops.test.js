const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  process.env.DOTENVX_OPS_OFF = 'false'
})

t.afterEach(() => {
  delete process.env.DOTENVX_OPS_OFF
})

t.test('status and keypair use npm binary when available', (ct) => {
  const execFileSync = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('on\n')) // status npm
    .onCall(2).returns(Buffer.from('{"public_key":"pub","private_key":"priv"}')) // keypair npm
    .onCall(3).returns(Buffer.from('{"public_key":"pub2","private_key":"priv2"}')) // keypair npm with arg

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, spawn }
  })

  const ops = new Ops()
  ct.equal(ops.status(), 'on')
  ct.same(ops.keypair(), { public_key: 'pub', private_key: 'priv' })
  ct.same(ops.keypair('existing-public-key'), { public_key: 'pub2', private_key: 'priv2' })

  ct.same(execFileSync.getCall(0).args[1], ['--version'])
  ct.same(execFileSync.getCall(1).args[1], ['status'])
  ct.same(execFileSync.getCall(2).args[1], ['keypair'])
  ct.same(execFileSync.getCall(3).args[1], ['keypair', 'existing-public-key'])
  ct.end()
})

t.test('falls back to cli binary and observe spawns detached process', (ct) => {
  const execFileSync = sinon.stub()
  const unref = sinon.stub()
  const spawn = sinon.stub().returns({ unref })

  execFileSync
    .onCall(0).throws(new Error('npm binary missing')) // --version npm
    .onCall(1).returns(Buffer.from('1.0.0\n')) // --version cli
    .onCall(2).returns(Buffer.from('on\n')) // status cli

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, spawn }
  })

  const ops = new Ops()
  ops.observe({ event: 'rotated', ok: true })

  ct.same(execFileSync.getCall(0).args[1], ['--version'])
  ct.same(execFileSync.getCall(1).args[1], ['--version'])
  ct.same(execFileSync.getCall(2).args[1], ['status'])

  ct.equal(spawn.callCount, 1)
  const spawnArgs = spawn.getCall(0).args
  ct.equal(spawnArgs[1][0], 'observe')
  ct.same(spawnArgs[2], { stdio: 'ignore', detached: true })
  ct.ok(Buffer.from(spawnArgs[1][1], 'base64').toString('utf8').includes('"event":"rotated"'))
  ct.equal(unref.callCount, 1)
  ct.end()
})

t.test('observe noops when spawn fails, status off, or forced off', (ct) => {
  const execFileSync = sinon.stub()
  const spawn = sinon.stub().throws(new Error('spawn failed'))

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version
    .onCall(1).returns(Buffer.from('on\n')) // status for observe gate
    .onCall(2).returns(Buffer.from('off\n')) // status for observe gate

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, spawn }
  })

  const ops = new Ops()
  ct.doesNotThrow(() => ops.observe({ should: 'not throw' }))
  ct.equal(spawn.callCount, 1)

  ops.observe({ should: 'skip when off' })
  ct.equal(spawn.callCount, 1)

  process.env.DOTENVX_OPS_OFF = 'true'
  ct.equal(ops.status(), 'off')
  ct.same(ops.keypair('ignored'), {})
  ops.observe({ should: 'skip when forced off' })
  ct.equal(spawn.callCount, 1)
  ct.end()
})

t.test('status is off when both npm and cli binaries are unavailable', (ct) => {
  const execFileSync = sinon.stub().throws(new Error('binary missing'))
  const spawn = sinon.stub()

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, spawn }
  })

  const ops = new Ops()
  ct.equal(ops.status(), 'off')
  ct.same(ops.keypair('anything'), {})
  ct.equal(execFileSync.callCount, 2)
  ct.end()
})
