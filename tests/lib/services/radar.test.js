const t = require('tap')
const sinon = require('sinon')
const capcon = require('capture-console')
const childProcess = require('child_process')

const packageJson = require('../../../src/lib/helpers/packageJson')
const { getColor } = require('../../../src/shared/colors')

const Radar = require('../../../src/lib/services/radar')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('when no dotenvx-radar', ct => {
  const radar = new Radar()
  ct.equal(radar.radarLib, null)
  ct.doesNotThrow(() => {
    radar.observe({})
  })
  ct.end()
})

t.test('when dotenvx-radar npm', ct => {
  const stub = sinon.stub(Radar.prototype, '_radarNpm').returns({
    observe: sinon.stub()
  })

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-radar cli', ct => {
  const stub = sinon.stub(Radar.prototype, '_radarCli').returns({
    observe: sinon.stub()
  })

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-radar cli stub childProcess.execSync', ct => {
  const stub = sinon.stub(childProcess, 'execSync')
  stub.withArgs('dotenvx-radar help').returns('some help')
  stub.withArgs(sinon.match(/^dotenvx-radar observe/)).returns(true)

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})

t.test('when dotenvx-radar cli stub childProcess.execSync', ct => {
  const stub = sinon.stub(childProcess, 'execSync')
  stub.withArgs('dotenvx-radar help').returns('some help')
  stub.withArgs(sinon.match(/^dotenvx-radar observe/)).throws(new Error('dotenvx-radar observe cli failed'))

  let radar
  const stdout = capcon.interceptStdout(() => {
    radar = new Radar()
  })
  ct.equal(stdout, `${getColor('olive')(`[dotenvx@${packageJson.version}] 📡 radar active`)}\n`)

  radar.observe({})
  t.ok(stub.called, 'Rotate().run() called')
  t.ok(radar.radarLib)

  stub.restore()
  ct.end()
})
