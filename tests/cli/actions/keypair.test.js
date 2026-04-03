const t = require('tap')
const sinon = require('sinon')

const main = require('./../../../src/lib/main')

const keypair = require('./../../../src/cli/actions/keypair')

async function captureStdout (fn) {
  let stdout = ''
  const stdoutWrite = process.stdout.write
  process.stdout.write = function (chunk, encoding, callback) {
    stdout += Buffer.isBuffer(chunk) ? chunk.toString() : chunk
    if (typeof callback === 'function') callback()
    return true
  }

  try {
    await fn()
  } finally {
    process.stdout.write = stdoutWrite
  }

  return stdout
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('keypair', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }, null, 0)}\n`)

  ct.end()
})

t.test('keypair KEY', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns('<publicKey>')

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, 'DOTENV_PUBLIC_KEY')
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, '<publicKey>\n')

  ct.end()
})

t.test('keypair --format shell', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=<privateKey>\n')

  ct.end()
})

t.test('keypair --format shell (when null value should be empty string for shell format)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: null })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=\n')

  ct.end()
})

t.test('keypair --pretty-print', async ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>' })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair --pp', async ct => {
  const optsStub = sinon.stub().returns({ pp: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>' })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'main.keypair() called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair KEY (not found)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns(undefined)
  const processExitStub = sinon.stub(process, 'exit')

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'main.keypair() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '\n') // send empty string if key's value undefined

  ct.end()
})

t.test('keypair --no-ops passes noOps to main.keypair', async ct => {
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'keypair').returns({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' })

  await keypair.call(fakeContext, undefined)

  t.ok(stub.calledOnce, 'main.keypair() called')
  t.equal(stub.firstCall.args[3], true, 'noOps true')

  ct.end()
})
