const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { EventEmitter } = require('events')

t.beforeEach(() => {
  sinon.restore()
})

t.test('jsonToEnv serializes settings as dotenv assignments', ct => {
  const jsonToEnv = require('../../../src/lib/helpers/jsonToEnv')

  ct.equal(jsonToEnv({ A: 'one', B: 'two' }), 'A="one"\nB="two"')
  ct.end()
})

t.test('buildOauthError attaches oauth code, help, and statusCode', ct => {
  const buildOauthError = require('../../../src/lib/helpers/buildOauthError')

  const error = buildOauthError(400, {
    error: 'authorization_pending',
    error_description: 'still waiting'
  })

  ct.equal(error.message, '[authorization_pending] still waiting')
  ct.equal(error.code, 'authorization_pending')
  ct.equal(error.help, '[authorization_pending] {"error":"authorization_pending","error_description":"still waiting"}')
  ct.equal(error.statusCode, 400)
  ct.end()
})

t.test('formatCode groups user code in fours', ct => {
  const formatCode = require('../../../src/lib/helpers/formatCode')

  ct.equal(formatCode('ABCD1234EF'), 'ABCD-1234-EF')
  ct.end()
})

t.test('http delegates to undici request', async ct => {
  const request = sinon.stub().resolves({ ok: true })
  const { http } = proxyquire('../../../src/lib/helpers/http', {
    undici: { request }
  })

  const out = await http('https://armor.dotenvx.com/oauth/token', { method: 'POST' })

  ct.same(out, { ok: true })
  ct.same(request.firstCall.args, ['https://armor.dotenvx.com/oauth/token', { method: 'POST' }])
})

t.test('openUrl opens without waiting', async ct => {
  const open = sinon.stub().resolves()
  const openUrl = proxyquire('../../../src/lib/helpers/openUrl', {
    open
  })

  await openUrl('https://armor.dotenvx.com/device')

  ct.same(open.firstCall.args, ['https://armor.dotenvx.com/device', { wait: false }])
})

t.test('createSpinner2 returns null when disabled', async ct => {
  const createSpinner2 = require('../../../src/lib/helpers/createSpinner2')
  const spinner = await createSpinner2({ quiet: true })

  ct.equal(spinner, null)
})

t.test('createSpinner2 creates and starts spinner when enabled', async ct => {
  const previousIsTTY = process.stderr.isTTY
  const previousCursorTo = process.stderr.cursorTo
  const previousClearLine = process.stderr.clearLine
  process.stderr.isTTY = true
  process.stderr.cursorTo = () => {}
  process.stderr.clearLine = () => {}

  const createSpinner2 = require('../../../src/lib/helpers/createSpinner2')
  const spinner = await createSpinner2()

  ct.type(spinner, 'object')
  ct.type(spinner.stop, 'function')
  spinner.stop()

  process.stderr.isTTY = previousIsTTY
  process.stderr.cursorTo = previousCursorTo
  process.stderr.clearLine = previousClearLine
})

t.test('listenForOpenKey returns noop when stdin is not a tty', ct => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin')
  const fakeStdin = new EventEmitter()
  fakeStdin.isTTY = false
  Object.defineProperty(process, 'stdin', { configurable: true, value: fakeStdin })

  const listenForOpenKey = require('../../../src/lib/helpers/listenForOpenKey')
  const cleanup = listenForOpenKey(sinon.stub())

  ct.type(cleanup, 'function')
  cleanup()

  Object.defineProperty(process, 'stdin', originalDescriptor)
  ct.end()
})

t.test('listenForOpenKey opens once and restores stdin on cleanup', async ct => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin')
  const fakeStdin = new EventEmitter()
  fakeStdin.isTTY = true
  fakeStdin.isRaw = false
  fakeStdin.setRawMode = sinon.stub()
  fakeStdin.resume = sinon.stub()
  fakeStdin.pause = sinon.stub()
  Object.defineProperty(process, 'stdin', { configurable: true, value: fakeStdin })

  const onOpen = sinon.stub().resolves()
  const listenForOpenKey = require('../../../src/lib/helpers/listenForOpenKey')
  const cleanup = listenForOpenKey(onOpen)

  fakeStdin.emit('data', '\r')
  fakeStdin.emit('data', 'y')
  await new Promise(resolve => setImmediate(resolve))
  cleanup()

  ct.equal(onOpen.callCount, 1)
  ct.same(fakeStdin.setRawMode.firstCall.args, [true])
  ct.same(fakeStdin.setRawMode.secondCall.args, [false])
  ct.equal(fakeStdin.resume.callCount, 1)
  ct.equal(fakeStdin.pause.callCount, 1)

  Object.defineProperty(process, 'stdin', originalDescriptor)
})

t.test('listenForOpenKey handles n and ctrl-c as interrupts', ct => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(process, 'stdin')
  const kill = sinon.stub(process, 'kill')
  const fakeStdin = new EventEmitter()
  fakeStdin.isTTY = true
  fakeStdin.isRaw = true
  fakeStdin.setRawMode = sinon.stub()
  fakeStdin.resume = sinon.stub()
  fakeStdin.pause = sinon.stub()
  Object.defineProperty(process, 'stdin', { configurable: true, value: fakeStdin })

  const listenForOpenKey = require('../../../src/lib/helpers/listenForOpenKey')

  listenForOpenKey(sinon.stub())
  fakeStdin.emit('data', 'n')

  listenForOpenKey(sinon.stub())
  fakeStdin.emit('data', '\u0003')

  ct.same(kill.firstCall.args, [process.pid, 'SIGINT'])
  ct.same(kill.secondCall.args, [process.pid, 'SIGINT'])

  Object.defineProperty(process, 'stdin', originalDescriptor)
  ct.end()
})
