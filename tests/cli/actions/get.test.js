const t = require('tap')
const sinon = require('sinon')
const capcon = require('capture-console')

const Get = require('./../../../src/lib/services/get')
const get = require('./../../../src/cli/actions/get')

t.beforeEach((ct) => {
  sinon.restore()
  process.env = {}
})

t.test('get', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, `${JSON.stringify({ HELLO: 'World' }, null, 0)}\n`)

  ct.end()
})

t.test('get KEY', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'World\n')

  ct.end()
})

t.test('get --format shell', ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO=World\n')

  ct.end()
})

t.test('get --format shell (with single quotes in value)', ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: "f'bar" } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO=f\'bar\n')

  ct.end()
})

t.test('get --format eval (with single quotes in value)', ct => {
  const optsStub = sinon.stub().returns({ format: 'eval' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: "f'bar" } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO="f\'bar"\n')

  ct.end()
})

t.test('get --format eval (multiple keys use newlines)', ct => {
  const optsStub = sinon.stub().returns({ format: 'eval' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World', HELLO2: 'World2' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO="World"\nHELLO2="World2"\n')

  ct.end()
})

t.test('get --format eval -f .env.test', ct => {
  const optsStub = sinon.stub().returns({ format: 'eval' })
  const fakeContext = {
    opts: optsStub,
    envs: [{ type: 'envFile', value: '.env.test' }]
  }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.same(stub.thisValues[0].envs, [{ type: 'envFile', value: '.env.test' }], 'envs passed to Get')
  t.equal(stdout, 'HELLO="World"\n')

  ct.end()
})

t.test('get --pretty-print', ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, `${JSON.stringify({ HELLO: 'World' }, null, 2)}\n`)

  ct.end()
})

t.test('get KEY --convention', ct => {
  const optsStub = sinon.stub().returns({ convention: 'nextjs' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = capcon.interceptStdout(() => {
    get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'World\n')

  ct.end()
})

t.test('get KEY (not found)', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('MISSING_KEY')
  error.code = 'MISSING_KEY'
  error.help = 'some help'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = capcon.interceptStdio(() => {
    get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n') // send empty string if key's value undefined
  t.ok(stderr.includes('MISSING_KEY'), 'stderr contains MISSING_KEY')
  t.ok(stderr.includes('some help'), 'stderr contains some help')

  ct.end()
})

t.test('get KEY (not found) --strict', ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('MISSING_KEY')
  error.code = 'MISSING_KEY'
  error.help = 'some help'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = capcon.interceptStdio(() => {
    get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '') // send empty string if key's value undefined
  t.ok(stderr.includes('MISSING_KEY'), 'stderr contains MISSING_KEY')
  t.ok(stderr.includes('some help'), 'stderr contains some help')

  ct.end()
})

t.test('get KEY (not found) --ignore', ct => {
  const optsStub = sinon.stub().returns({ ignore: ['MISSING_KEY'] })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('MISSING_KEY')
  error.code = 'MISSING_KEY'
  error.help = 'some help'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = capcon.interceptStdio(() => {
    get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n') // send empty string if key's value undefined
  console.log('stderr', stderr)
  t.ok(!stderr.includes('MISSING_KEY'), 'stderr does not contain MISSING_KEY')

  ct.end()
})
