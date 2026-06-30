const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

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

function loadKeypairAction ({ result, error, spinner, catchAndLog } = {}) {
  const keypairResolver = sinon.stub()
  if (error) {
    keypairResolver.rejects(error)
  } else {
    keypairResolver.resolves(result || {})
  }

  const fakeSpinner = spinner || {
    text: 'retrieving',
    stop: sinon.stub()
  }

  const catchAndLogStub = catchAndLog || sinon.stub()
  const keypair = proxyquire('./../../../src/cli/actions/keypair', {
    './../../lib/resolvers/keypair': keypairResolver,
    './../../lib/helpers/catchAndLog': catchAndLogStub,
    '../../lib/helpers/createSpinner': sinon.stub().resolves(fakeSpinner)
  })

  return { keypair, keypairResolver, spinner: fakeSpinner, catchAndLog: catchAndLogStub }
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('keypair', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }, null, 0)}\n`)

  ct.end()
})

t.test('keypair KEY', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, 'DOTENV_PUBLIC_KEY')
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, '<publicKey>\n')

  ct.end()
})

t.test('keypair --format shell', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=<privateKey>\n')

  ct.end()
})

t.test('keypair --format shell (when null value should be empty string for shell format)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: null }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY=<publicKey> DOTENV_PRIVATE_KEY=\n')

  ct.end()
})

t.test('keypair --format colon', async ct => {
  const optsStub = sinon.stub().returns({ format: 'colon' })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY:<publicKey> DOTENV_PRIVATE_KEY:<privateKey>\n')

  ct.end()
})

t.test('keypair --format colon (when null value should be empty string for colon format)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'colon' })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: null }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, 'DOTENV_PUBLIC_KEY:<publicKey> DOTENV_PRIVATE_KEY:\n')

  ct.end()
})

t.test('keypair KEY --format colon', async ct => {
  const optsStub = sinon.stub().returns({ format: 'colon' })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PRIVATE_KEY: '<privateKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, 'DOTENV_PRIVATE_KEY')
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, 'DOTENV_PRIVATE_KEY:<privateKey>\n')

  ct.end()
})

t.test('keypair --pretty-print', async ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair --pp', async ct => {
  const optsStub = sinon.stub().returns({ pp: true })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>' }
  })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.equal(stdout, `${JSON.stringify({ DOTENV_PUBLIC_KEY: '<publicKey>' }, null, 2)}\n`)

  ct.end()
})

t.test('keypair KEY (not found)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const processExitStub = sinon.stub(process, 'exit')
  const { keypair, keypairResolver } = loadKeypairAction({ result: {} })

  const stdout = await captureStdout(async () => {
    await keypair.call(fakeContext, 'NOTFOUND')
  })

  t.ok(keypairResolver.called, 'keypair resolver called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '\n')

  ct.end()
})

t.test('keypair --no-ops passes armor false to keypair resolver', async ct => {
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const { keypair, keypairResolver } = loadKeypairAction({
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })

  await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  t.ok(keypairResolver.calledOnce, 'keypair resolver called')
  t.equal(keypairResolver.firstCall.args[0].armor, false, 'armor false')

  ct.end()
})

t.test('keypair updates spinner text while waiting for approval', async ct => {
  const fakeSpinner = {
    text: 'retrieving',
    stop: sinon.stub()
  }
  const { keypair, keypairResolver } = loadKeypairAction({
    spinner: fakeSpinner,
    result: { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })
  keypairResolver.callsFake(async function (options) {
    options.onStatus('[ACCESS_APPROVAL_REQUIRED] visit [https://armor.dotenvx.com/grants/grant-token-123] and approve (027 C9C)')
    return { DOTENV_PUBLIC_KEY: '<publicKey>', DOTENV_PRIVATE_KEY: '<privateKey>' }
  })
  const fakeContext = { opts: sinon.stub().returns({}) }

  await captureStdout(async () => {
    await keypair.call(fakeContext, undefined)
  })

  ct.ok(keypairResolver.calledOnce, 'keypair resolver called')
  ct.equal(fakeSpinner.text, '[ACCESS_APPROVAL_REQUIRED] visit [https://armor.dotenvx.com/grants/grant-token-123] and approve (027 C9C)')
  ct.ok(fakeSpinner.stop.called, 'spinner stopped')
  ct.end()
})

t.test('keypair logs provider errors without an uncaught stack', async ct => {
  const error = new Error('[ACCESS_APPROVAL_EXPIRED] approval expired')
  error.code = 'ACCESS_APPROVAL_EXPIRED'
  const fakeSpinner = {
    text: 'retrieving',
    stop: sinon.stub()
  }
  const catchAndLogStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const { keypair } = loadKeypairAction({
    spinner: fakeSpinner,
    catchAndLog: catchAndLogStub,
    error
  })
  const fakeContext = { opts: sinon.stub().returns({}) }

  await keypair.call(fakeContext, undefined)

  ct.same(catchAndLogStub.firstCall && catchAndLogStub.firstCall.args, [error])
  ct.ok(fakeSpinner.stop.called, 'spinner stopped')
  ct.ok(processExitStub.calledWith(1), 'process.exit(1)')
  ct.end()
})
