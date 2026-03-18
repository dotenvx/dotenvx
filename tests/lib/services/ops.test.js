const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const capcon = require('capture-console')
const childProcess = require('child_process')

const packageJson = require('../../../src/lib/helpers/packageJson')
const { getColor } = require('../../../src/shared/colors')

const Ops = require('../../../src/lib/services/ops')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('when no dotenvx-ops', ct => {
  sinon.stub(Ops.prototype, '_opsNpm').throws(new Error('npm lib unavailable'))
  sinon.stub(Ops.prototype, '_opsCli').throws(new Error('cli unavailable'))
  const ops = new Ops()
  ct.equal(ops.opsLib, null)
  ct.doesNotThrow(() => {
    ops.observe({})
  })
  ct.end()
})

t.test('when dotenvx-ops npm', ct => {
  const stub = sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'on',
    observe: sinon.stub()
  })

  let ops
  const stdout = capcon.interceptStdout(() => {
    ops = new Ops()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 🛡️ ops: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-ops npm but then observe fails somehow', ct => {
  const subprocessStub = sinon.stub(childProcess, 'spawn')
  subprocessStub.throws(new Error('bin/dotenvx-ops observe failed'))

  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  const stub = sinon.stub(childProcess, 'execSync')
  stub.withArgs(`${fallbackBin} status`).returns('on')

  let ops
  const stdout = capcon.interceptStdout(() => {
    ops = new Ops()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 🛡️ ops: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-ops cli', ct => {
  const stub = sinon.stub(Ops.prototype, '_opsCli').returns({
    status: 'on',
    observe: sinon.stub()
  })

  let ops
  const stdout = capcon.interceptStdout(() => {
    ops = new Ops()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 🛡️ ops: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})

t.test('keypair does not attempt command when off', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'off',
    observe: sinon.stub()
  })
  const execStub = sinon.stub(childProcess, 'execFileSync')
  execStub.withArgs(fallbackBin, ['status'], sinon.match.object).returns(Buffer.from('off'))

  const ops = new Ops()
  const result = ops.keypair('pub')

  t.equal(result, null)
  t.ok(execStub.calledOnceWithExactly(fallbackBin, ['status'], sinon.match.object), 'status checked once and keypair skipped')
  ct.end()
})

t.test('keypair returns private key from fallback bin output', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'on',
    observe: sinon.stub()
  })
  const stub = sinon.stub(childProcess, 'execFileSync')
  stub.withArgs(fallbackBin, ['status'], sinon.match.object).returns(Buffer.from('on'))
  stub.withArgs(fallbackBin, ['keypair', 'pub'], sinon.match.object).returns(Buffer.from('{"private_key":"private123"}'))

  const ops = new Ops()
  const result = ops.keypair('pub')

  t.equal(result, 'private123')
  t.ok(stub.calledTwice, 'status and fallback keypair attempted')
  ct.end()
})

t.test('keypair falls back to global cli when fallback bin fails', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'on',
    observe: sinon.stub()
  })
  const stub = sinon.stub(childProcess, 'execFileSync')
  stub.withArgs(fallbackBin, ['status'], sinon.match.object).returns(Buffer.from('on'))
  stub.withArgs(fallbackBin, ['keypair', 'pub'], sinon.match.object).throws(new Error('fallback unavailable'))
  stub.withArgs('dotenvx-ops', ['keypair', 'pub'], sinon.match.object).returns(Buffer.from('{"private_key":"private456"}'))

  const ops = new Ops()
  const result = ops.keypair('pub')

  t.equal(result, 'private456')
  t.ok(stub.calledThrice, 'status, fallback keypair, and global cli attempted')
  ct.end()
})

t.test('when dotenvx-ops cli stub childProcess.execSync', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  const stub = sinon.stub(childProcess, 'execSync')
  stub.withArgs(`${fallbackBin} status`).throws(new Error('bin/dotenvx-ops status failed'))
  stub.withArgs('dotenvx-ops status').returns('on')
  stub.withArgs(sinon.match(/^dotenvx-ops observe/)).returns(true)

  const stub2 = sinon.stub(childProcess, 'spawn')
  stub2.returns('success')

  let ops
  const stdout = capcon.interceptStdout(() => {
    ops = new Ops()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 🛡️ ops: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})

t.test('keypair returns null when both keypair commands fail', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'on',
    observe: sinon.stub()
  })

  const stub = sinon.stub(childProcess, 'execFileSync')
  stub.withArgs(fallbackBin, ['status'], sinon.match.object).returns(Buffer.from('on'))
  stub.withArgs(fallbackBin, ['keypair', 'pub'], sinon.match.object).throws(new Error('fallback failed'))
  stub.withArgs('dotenvx-ops', ['keypair', 'pub'], sinon.match.object).throws(new Error('global failed'))

  const ops = new Ops()
  const result = ops.keypair('pub')

  ct.equal(result, null)
  ct.end()
})

t.test('_status returns null when fallback and global status both fail', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  sinon.stub(Ops.prototype, '_opsNpm').returns({
    status: 'on',
    observe: sinon.stub()
  })

  const stub = sinon.stub(childProcess, 'execFileSync')
  stub.withArgs(fallbackBin, ['status'], sinon.match.object).throws(new Error('fallback status failed'))
  stub.withArgs('dotenvx-ops', ['status'], sinon.match.object).throws(new Error('global status failed'))

  const ops = new Ops()
  const status = ops._status()

  ct.equal(status, null)
  ct.end()
})

t.test('when dotenvx-ops cli stub childProcess.execSync', ct => {
  const fallbackBin = path.resolve(process.cwd(), 'node_modules/.bin/dotenvx-ops')
  const stub = sinon.stub(childProcess, 'execSync')
  stub.withArgs(`${fallbackBin} status`).throws(new Error('bin/dotenvx-ops status failed'))
  stub.withArgs('dotenvx-ops status').returns('on')
  stub.withArgs(sinon.match(/^dotenvx-ops observe/)).throws(new Error('dotenvx-ops observe cli failed'))

  const stub2 = sinon.stub(childProcess, 'spawn')
  stub2.returns('success')

  let ops
  const stdout = capcon.interceptStdout(() => {
    ops = new Ops()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 🛡️ ops: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})
