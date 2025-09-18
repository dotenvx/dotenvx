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
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar: on`)}\n`)

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
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar: on`)}\n`)

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
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
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
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
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
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar: on`)}\n`)

  ops.observe({})
  t.ok(stub.called, 'Ops().run() called')
  t.ok(ops.opsLib)

  stub.restore()
  ct.end()
})
