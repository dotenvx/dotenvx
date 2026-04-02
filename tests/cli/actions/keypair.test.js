const t = require('tap')
const sinon = require('sinon')
const capcon = require('capture-console')

const main = require('./../../../src/lib/main')

const keypair = require('./../../../src/cli/actions/keypair')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('keypair', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }, null, 0)}\n`)

  ct.end()
})

t.test('keypair KEY', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns('<publicKey>')

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, 'DOTENV_PUBLIC_KEY')
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, '<publicKey>\n')

  ct.end()
})

t.test('keypair --format shell', ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=<privateKey>\n')

  ct.end()
})

t.test('keypair --format shell (when null value should be empty string for shell format)', ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: null })

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=\n')

  ct.end()
})

t.test('keypair --pretty-print', ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>' })

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair --pp', ct => {
  const optsStub = sinon.stub().returns({ pp: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>' })

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair KEY (not found)', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns(undefined)
  const processExitStub = sinon.stub(process, 'exit')

  const stdout = capcon.interceptStdout(() => {
    keypair.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'main.keypair() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '\n') // send empty string if key's value undefined

  ct.end()
})

t.test('keypair --no-ops passes noOps to main.keypair', ct => {
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  keypair.call(fakeContext, undefined)

  t.ok(stub.calledOnce, 'main.keypair() called')
  t.equal(stub.firstCall.args[3], true, 'noOps true')

  ct.end()
})
