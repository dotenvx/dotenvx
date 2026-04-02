const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const util = require('util')

t.beforeEach(() => {
  process.env.DOTENVX_OPS_OFF = 'false'
})

t.afterEach(() => {
  delete process.env.DOTENVX_OPS_OFF
})

t.test('status and keypair use npm binary when available', async (ct) => {
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
    .onCall(1).resolves({ stdout: Buffer.from('on\n') }) // status npm
    .onCall(2).resolves({ stdout: Buffer.from('{"public_key":"pub","private_key":"priv"}') }) // keypair npm
    .onCall(3).resolves({ stdout: Buffer.from('{"public_key":"pub2","private_key":"priv2"}') }) // keypair npm with arg

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(await ops.status(), 'on')
  ct.same(await ops.keypair(), { public_key: 'pub', private_key: 'priv' })
  ct.same(await ops.keypair('existing-public-key'), { public_key: 'pub2', private_key: 'priv2' })

  ct.same(promisifiedExecFile.getCall(0).args[1], ['--version'])
  ct.same(promisifiedExecFile.getCall(1).args[1], ['status'])
  ct.same(promisifiedExecFile.getCall(2).args[1], ['keypair'])
  ct.same(promisifiedExecFile.getCall(3).args[1], ['keypair', 'existing-public-key'])
  ct.end()
})

t.test('falls back to cli binary and observe spawns detached process', async (ct) => {
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const unref = sinon.stub()
  const spawn = sinon.stub().returns({ unref })

  promisifiedExecFile
    .onCall(0).rejects(new Error('npm binary missing')) // --version npm
    .onCall(1).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version cli
    .onCall(2).resolves({ stdout: Buffer.from('on\n') }) // status cli

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFile, spawn }
  })

  const ops = new Ops()
  ops.observe({ event: 'rotated', ok: true })
  await new Promise(resolve => setTimeout(resolve, 10))

  ct.same(promisifiedExecFile.getCall(0).args[1], ['--version'])
  ct.same(promisifiedExecFile.getCall(1).args[1], ['--version'])
  ct.same(promisifiedExecFile.getCall(2).args[1], ['status'])

  ct.equal(spawn.callCount, 1)
  const spawnArgs = spawn.getCall(0).args
  ct.equal(spawnArgs[1][0], 'observe')
  ct.same(spawnArgs[2], { stdio: 'ignore', detached: true })
  ct.ok(Buffer.from(spawnArgs[1][1], 'base64').toString('utf8').includes('"event":"rotated"'))
  ct.equal(unref.callCount, 1)
  ct.end()
})

t.test('observe noops when spawn fails, status off, or forced off', async (ct) => {
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub().throws(new Error('spawn failed'))

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version
    .onCall(1).resolves({ stdout: Buffer.from('on\n') }) // status for observe gate
    .onCall(2).resolves({ stdout: Buffer.from('off\n') }) // status for observe gate

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFile, spawn }
  })

  const ops = new Ops()
  ct.doesNotThrow(() => ops.observe({ should: 'not throw' }))
  await new Promise(resolve => setTimeout(resolve, 10))
  ct.equal(spawn.callCount, 1)

  ops.observe({ should: 'skip when off' })
  await new Promise(resolve => setTimeout(resolve, 10))
  ct.equal(spawn.callCount, 1)

  process.env.DOTENVX_OPS_OFF = 'true'
  ct.equal(await ops.status(), 'off')
  ct.same(await ops.keypair('ignored'), {})
  ops.observe({ should: 'skip when forced off' })
  await new Promise(resolve => setTimeout(resolve, 10))
  ct.equal(spawn.callCount, 1)
  ct.end()
})

t.test('status is off when both npm and cli binaries are unavailable', async (ct) => {
  const promisifiedExecFile = sinon.stub().rejects(new Error('binary missing'))
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(await ops.status(), 'off')
  ct.same(await ops.keypair('anything'), {})
  ct.equal(promisifiedExecFile.callCount, 2)
  ct.end()
})
