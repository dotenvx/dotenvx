const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const util = require('util')
const { EventEmitter } = require('events')

function spawnResult (stdout, code = 0, stderr) {
  const subprocess = new EventEmitter()
  subprocess.stdout = new EventEmitter()
  subprocess.stderr = new EventEmitter()
  setImmediate(() => {
    if (stdout !== undefined) {
      subprocess.stdout.emit('data', Buffer.from(stdout))
    }
    if (stderr !== undefined) {
      for (const chunk of [].concat(stderr)) {
        subprocess.stderr.emit('data', Buffer.from(chunk))
      }
    }
    subprocess.emit('close', code)
  })
  return subprocess
}

t.beforeEach(() => {
  process.env.DOTENVX_NO_OPS = 'false'
  process.env.DOTENVX_NO_VLT = 'false'
})

t.afterEach(() => {
  delete process.env.DOTENVX_NO_OPS
  delete process.env.DOTENVX_NO_VLT
})

t.test('statusSync and keypairSync use npm binary when available', (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('on\n')) // status npm
    .onCall(2).returns(Buffer.from('{"public_key":"pub","private_key":"priv"}')) // keypair npm
    .onCall(3).returns(Buffer.from('{"public_key":"pub2","private_key":"priv2"}')) // keypair npm with arg

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(ops.statusSync(), 'on')
  ct.same(ops.keypairSync(), { public_key: 'pub', private_key: 'priv' })
  ct.same(ops.keypairSync('existing-public-key'), { public_key: 'pub2', private_key: 'priv2' })

  ct.same(execFileSync.getCall(0).args[1], ['--version'])
  ct.same(execFileSync.getCall(1).args[1], ['status'])
  ct.same(execFileSync.getCall(2).args[1], ['keypair'])
  ct.same(execFileSync.getCall(3).args[1], ['keypair', 'existing-public-key'])
  ct.end()
})

t.test('keypairSync can disable child spinner', (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(ops.keypairSync('existing-public-key', { noSpinner: true }), { public_key: 'pub', private_key: 'priv' })
  ct.same(execFileSync.getCall(1).args[1], ['keypair', '--no-spinner', 'existing-public-key'])
  ct.end()
})

t.test('keypairSync forwards token to dotenvx-ops', (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(ops.keypairSync('existing-public-key', { token: 'token-123' }), { public_key: 'pub', private_key: 'priv' })
  ct.same(execFileSync.getCall(1).args[1], ['keypair', '--token', 'token-123', 'existing-public-key'])
  ct.end()
})

t.test('keypairSync forwards env filepath to dotenvx-ops', (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(ops.keypairSync('existing-public-key', { envFilepath: '.env.production' }), { public_key: 'pub', private_key: 'priv' })
  ct.same(execFileSync.getCall(1).args[1], ['keypair', '-f', '.env.production', 'existing-public-key'])
  ct.end()
})

t.test('status uses execFile and keypair uses interactive spawn', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
    .onCall(1).resolves({ stdout: Buffer.from('on\n') }) // status npm
  spawn
    .onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}'))
    .onCall(1).returns(spawnResult('{"public_key":"pub2","private_key":"priv2"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(await ops.status(), 'on')
  ct.same(await ops.keypair(), { public_key: 'pub', private_key: 'priv' })
  ct.same(await ops.keypair('existing-public-key'), { public_key: 'pub2', private_key: 'priv2' })

  ct.same(promisifiedExecFile.getCall(0).args[1], ['--version'])
  ct.same(promisifiedExecFile.getCall(1).args[1], ['status'])
  ct.same(spawn.getCall(0).args, [promisifiedExecFile.getCall(0).args[0], ['keypair'], {
    stdio: ['inherit', 'pipe', 'pipe']
  }])
  ct.same(spawn.getCall(1).args, [promisifiedExecFile.getCall(0).args[0], ['keypair', 'existing-public-key'], {
    stdio: ['inherit', 'pipe', 'pipe']
  }])
  ct.end()
})

t.test('keypair forwards env filepath to dotenvx-ops', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn
    .onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair('existing-public-key', { envFilepath: '.env.production' }), { public_key: 'pub', private_key: 'priv' })
  ct.same(spawn.getCall(0).args, [promisifiedExecFile.getCall(0).args[0], ['keypair', '-f', '.env.production', 'existing-public-key'], {
    stdio: ['inherit', 'pipe', 'pipe']
  }])
  ct.end()
})

t.test('falls back to cli binary and observe spawns detached process', (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const unref = sinon.stub()
  const spawn = sinon.stub().returns({ unref })

  execFileSync
    .onCall(0).throws(new Error('npm binary missing')) // --version npm
    .onCall(1).returns(Buffer.from('1.0.0\n')) // --version cli
    .onCall(2).returns(Buffer.from('on\n')) // status cli

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
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

t.test('observe noops when spawn fails, status off, or forced off', async (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub().throws(new Error('spawn failed'))

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version
    .onCall(1).returns(Buffer.from('on\n')) // status for observe gate
    .onCall(2).returns(Buffer.from('off\n')) // status for observe gate

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.doesNotThrow(() => ops.observe({ should: 'not throw' }))
  ct.equal(spawn.callCount, 1)

  ops.observe({ should: 'skip when off' })
  ct.equal(spawn.callCount, 1)

  process.env.DOTENVX_NO_OPS = 'true'
  ct.equal(ops.statusSync(), 'off')
  ct.same(ops.keypairSync('ignored'), {})
  ct.same(await ops.keypair('ignored'), {})
  ops.observe({ should: 'skip when forced off' })
  ct.equal(spawn.callCount, 1)
  ct.end()
})

t.test('forced off supports DOTENVX_NO_VLT synonym', async (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  process.env.DOTENVX_NO_VLT = 'true'
  const ops = new Ops()
  ct.equal(ops.statusSync(), 'off')
  ct.same(ops.keypairSync('ignored'), {})
  ct.same(await ops.keypair('ignored'), {})
  ops.observe({ should: 'skip when forced off' })
  ct.equal(execFileSync.callCount, 0)
  ct.equal(spawn.callCount, 0)
  ct.end()
})

t.test('status/statusSync are off when both npm and cli binaries are unavailable', async (ct) => {
  const execFileSync = sinon.stub().throws(new Error('binary missing'))
  const promisifiedExecFile = sinon.stub().rejects(new Error('binary missing'))
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(ops.statusSync(), 'off')
  ct.same(ops.keypairSync('anything'), {})
  ct.equal(await ops.status(), 'off')
  ct.same(await ops.keypair('anything'), {})
  ct.equal(execFileSync.callCount, 2)
  ct.equal(promisifiedExecFile.callCount, 2)
  ct.end()
})

t.test('status/statusSync return off when status command fails after binary resolves', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).throws(new Error('status failed')) // status npm

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
    .onCall(1).rejects(new Error('status failed')) // status npm

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const opsSync = new Ops()
  ct.equal(opsSync.statusSync(), 'off')

  const opsAsync = new Ops()
  ct.equal(await opsAsync.status(), 'off')
  ct.end()
})

t.test('keypair/keypairSync return empty object when parsing or exec fails', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).returns(Buffer.from('not-json')) // keypair output

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult('not-json')) // keypair output

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const opsSync = new Ops()
  ct.same(opsSync.keypairSync(), {})

  const opsAsync = new Ops()
  ct.same(await opsAsync.keypair(), {})
  ct.end()
})

t.test('observe returns early when status check throws', (ct) => {
  const execFileSync = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  execFileSync
    .onCall(0).returns(Buffer.from('1.0.0\n')) // --version npm
    .onCall(1).throws(new Error('status failed')) // status npm

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.doesNotThrow(() => ops.observe({ event: 'x' }))
  ct.equal(spawn.callCount, 0)
  ct.end()
})

t.test('status async falls back to cli binary when npm binary is unavailable', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).rejects(new Error('npm binary missing')) // npm --version
    .onCall(1).resolves({ stdout: Buffer.from('1.0.0\n') }) // cli --version
    .onCall(2).resolves({ stdout: Buffer.from('on\n') }) // cli status

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(await ops.status(), 'on')
  ct.equal(promisifiedExecFile.getCall(1).args[0], 'dotenvx-ops')
  ct.end()
})

t.test('observe returns early when no binary can be resolved', (ct) => {
  const execFileSync = sinon.stub().throws(new Error('binary missing'))
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = sinon.stub()
  const spawn = sinon.stub()

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.doesNotThrow(() => ops.observe({ event: 'x' }))
  ct.equal(spawn.callCount, 0)
  ct.end()
})

t.test('keypair async inherits stdin and pipes stderr while parsing stdout json', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair(), { public_key: 'pub', private_key: 'priv' })
  ct.same(spawn.firstCall.args[2], {
    stdio: ['inherit', 'pipe', 'pipe']
  })
  ct.end()
})

t.test('keypair async forwards child stderr after onStderr hook', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()
  const onStderr = sinon.stub()
  const stderrWrite = sinon.stub(process.stderr, 'write')
  ct.teardown(() => stderrWrite.restore())

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}', 0, ['Select team', '\n']))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair(undefined, { onStderr }), { public_key: 'pub', private_key: 'priv' })
  ct.equal(onStderr.callCount, 1)
  ct.equal(stderrWrite.callCount, 2)
  ct.equal(stderrWrite.firstCall.args[0].toString(), 'Select team')
  ct.ok(onStderr.calledBefore(stderrWrite))
  ct.same(spawn.firstCall.args[2].stdio, ['inherit', 'pipe', 'pipe'])
  ct.end()
})

t.test('keypair async can disable child spinner', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair('existing-public-key', { noSpinner: true }), { public_key: 'pub', private_key: 'priv' })
  ct.same(spawn.firstCall.args[1], ['keypair', '--no-spinner', 'existing-public-key'])
  ct.same(spawn.firstCall.args[2].stdio, ['inherit', 'pipe', 'pipe'])
  ct.notOk(spawn.firstCall.args[2].env)
  ct.end()
})

t.test('keypair async forwards token to dotenvx-ops', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult('{"public_key":"pub","private_key":"priv"}'))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair('existing-public-key', { token: 'token-123' }), { public_key: 'pub', private_key: 'priv' })
  ct.same(spawn.firstCall.args[1], ['keypair', '--token', 'token-123', 'existing-public-key'])
  ct.same(spawn.firstCall.args[2].stdio, ['inherit', 'pipe', 'pipe'])
  ct.end()
})

t.test('status async writes stderr from ops process', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()
  const stderrWrite = sinon.stub(process.stderr, 'write')
  ct.teardown(() => stderrWrite.restore())

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
    .onCall(1).resolves({ stdout: Buffer.from('on\n'), stderr: Buffer.from('ops warning\n') })

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.equal(await ops.status(), 'on')
  ct.equal(stderrWrite.callCount, 1)
  ct.equal(stderrWrite.firstCall.args[0], 'ops warning\n')
  ct.end()
})

t.test('keypair async returns empty object when interactive process exits non-zero', async (ct) => {
  const execFileSync = sinon.stub()
  const promisifiedExecFile = sinon.stub()
  const execFile = sinon.stub()
  execFile[util.promisify.custom] = promisifiedExecFile
  const spawn = sinon.stub()

  promisifiedExecFile
    .onCall(0).resolves({ stdout: Buffer.from('1.0.0\n') }) // --version npm
  spawn.onCall(0).returns(spawnResult(undefined, 23))

  const Ops = proxyquire('../../../src/lib/extensions/ops', {
    child_process: { execFileSync, execFile, spawn }
  })

  const ops = new Ops()
  ct.same(await ops.keypair(), {})
  ct.end()
})
