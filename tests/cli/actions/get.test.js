const t = require('tap')
const sinon = require('sinon')

const Get = require('./../../../src/lib/services/get')
const Errors = require('./../../../src/lib/helpers/errors')
const get = require('./../../../src/cli/actions/get')

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

async function captureStdio (fn) {
  let stdout = ''
  let stderr = ''
  const stdoutWrite = process.stdout.write
  const stderrWrite = process.stderr.write
  process.stdout.write = function (chunk, encoding, callback) {
    stdout += Buffer.isBuffer(chunk) ? chunk.toString() : chunk
    if (typeof callback === 'function') callback()
    return true
  }
  process.stderr.write = function (chunk, encoding, callback) {
    stderr += Buffer.isBuffer(chunk) ? chunk.toString() : chunk
    if (typeof callback === 'function') callback()
    return true
  }

  try {
    await fn()
  } finally {
    process.stdout.write = stdoutWrite
    process.stderr.write = stderrWrite
  }

  return { stdout, stderr }
}

function setCode (error, code) {
  error.code = code
  const issueUrl = Errors.ISSUE_BY_CODE[code]
  if (issueUrl) {
    error.fix = `fix: [${issueUrl}]`
    error.help = `fix: [${issueUrl}]`
  }
  if (!Object.getOwnPropertyDescriptor(error, 'messageWithHelp')) {
    Object.defineProperty(error, 'messageWithHelp', {
      configurable: true,
      enumerable: true,
      get () {
        if (this.help && this.help.startsWith('fix:') && this.message) return `${this.message}. ${this.help}`
        return this.message
      }
    })
  }
}

t.beforeEach((ct) => {
  sinon.restore()
  process.env = {}
})

t.test('get', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, `${JSON.stringify({ HELLO: 'World' }, null, 0)}\n`)

  ct.end()
})

t.test('get KEY', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'World\n')

  ct.end()
})

t.test('get --format shell', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO=World\n')

  ct.end()
})

t.test('get --format shell (with single quotes in value)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'shell' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: "f'bar" } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO=f\'bar\n')

  ct.end()
})

t.test('get --format eval (with single quotes in value)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'eval' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: "f'bar" } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO="f\'bar"\n')

  ct.end()
})

t.test('get --format eval (multiple keys use newlines)', async ct => {
  const optsStub = sinon.stub().returns({ format: 'eval' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World', HELLO2: 'World2' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'HELLO="World"\nHELLO2="World2"\n')

  ct.end()
})

t.test('get --pretty-print', async ct => {
  const optsStub = sinon.stub().returns({ prettyPrint: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, `${JSON.stringify({ HELLO: 'World' }, null, 2)}\n`)

  ct.end()
})

t.test('get --pp', async ct => {
  const optsStub = sinon.stub().returns({ pp: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, undefined)
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, `${JSON.stringify({ HELLO: 'World' }, null, 2)}\n`)

  ct.end()
})

t.test('get KEY --convention', async ct => {
  const optsStub = sinon.stub().returns({ convention: 'nextjs' })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { HELLO: 'World' } })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stdout, 'World\n')

  ct.end()
})

t.test('get --no-ops passes opsOn false to Get service', async ct => {
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run').returns({ parsed: { HELLO: 'World' }, errors: [] })

  const stdout = await captureStdout(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.equal(stub.thisValues[0].opsOn, false, 'opsOn false')
  t.equal(stdout, 'World\n')

  ct.end()
})

t.test('get KEY (not found)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_KEY] missing key (NOTFOUND)')
  setCode(error, 'MISSING_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n') // send empty string if key's value undefined
  t.ok(stderr.includes('[MISSING_KEY] missing key (NOTFOUND). fix: [https://github.com/dotenvx/dotenvx/issues/759]'), 'stderr contains formatted MISSING_KEY')

  ct.end()
})

t.test('get KEY (not found) --strict', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_KEY] missing key (NOTFOUND)')
  setCode(error, 'MISSING_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '') // send empty string if key's value undefined
  t.ok(stderr.includes('[MISSING_KEY] missing key (NOTFOUND)'), 'stderr contains formatted MISSING_KEY')
  t.ok(!stderr.includes('some help'), 'stderr omits custom help in strict catch path')

  ct.end()
})

t.test('get KEY (not found) --ignore', async ct => {
  const optsStub = sinon.stub().returns({ ignore: ['MISSING_KEY'] })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('MISSING_KEY')
  setCode(error, 'MISSING_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n') // send empty string if key's value undefined
  console.log('stderr', stderr)
  t.ok(!stderr.includes('MISSING_KEY'), 'stderr does not contain MISSING_KEY')

  ct.end()
})

t.test('get KEY (missing env file) logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n')
  t.ok(stderr.includes('[MISSING_ENV_FILE] missing file (.env)'), 'stderr contains one-line missing-env-file text')
  t.ok(stderr.includes('fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'stderr contains fix url')

  ct.end()
})

t.test('get KEY (missing env file fallback path) logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_ENV_FILE] missing file')
  setCode(error, 'MISSING_ENV_FILE')
  error.filepath = undefined
  error.envFilepath = undefined
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, '\n')
  t.ok(stderr.includes('[MISSING_ENV_FILE] missing file. fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'stderr contains one-line fallback message')

  ct.end()
})

t.test('get KEY (missing env file) --strict logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'NOTFOUND')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '')
  t.ok(stderr.includes('[MISSING_ENV_FILE] missing file (.env)'), 'stderr contains one-line missing-env-file text')
  t.ok(stderr.includes('fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'stderr contains fix url')

  ct.end()
})

t.test('get KEY (wrong private key) logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  setCode(error, 'WRONG_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, 'World\n')
  t.ok(stderr.includes("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'stderr contains one-line wrong private key')
  t.ok(!stderr.includes('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'stderr does not contain separate help line')

  ct.end()
})

t.test('get KEY (wrong private key punctuated) keeps one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[WRONG_PRIVATE_KEY] punctuated')
  setCode(error, 'WRONG_PRIVATE_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })
  const { stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(stderr.includes('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  ct.end()
})

t.test('get KEY (wrong private key punctuated) --strict keeps one line', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[WRONG_PRIVATE_KEY] punctuated')
  setCode(error, 'WRONG_PRIVATE_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '')
  t.ok(stderr.includes('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'), 'stderr contains punctuated one-line wrong private key')

  ct.end()
})

t.test('get KEY (missing private key) logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  setCode(error, 'MISSING_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.notOk(processExitStub.called)
  t.equal(stdout, 'World\n')
  t.ok(stderr.includes("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'stderr contains one-line missing private key')
  t.ok(!stderr.includes('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'stderr does not contain separate help line')

  ct.end()
})

t.test('get KEY (missing private key punctuated) keeps one-line fix', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_PRIVATE_KEY] punctuated')
  setCode(error, 'MISSING_PRIVATE_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })
  const { stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(stderr.includes('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  ct.end()
})

t.test('get KEY (missing private key) --strict logs one-line fix', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }

  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  setCode(error, 'MISSING_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })

  const processExitStub = sinon.stub(process, 'exit')

  const { stdout, stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.equal(stdout, '')
  t.ok(stderr.includes("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'stderr contains one-line missing private key')
  t.ok(!stderr.includes('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'stderr does not contain separate help line')

  ct.end()
})

t.test('get KEY (wrong private key non-punctuated) --strict appends period', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[WRONG_PRIVATE_KEY] no period')
  setCode(error, 'WRONG_PRIVATE_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })
  const processExitStub = sinon.stub(process, 'exit')
  const { stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(stderr.includes('[WRONG_PRIVATE_KEY] no period. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  ct.end()
})

t.test('get KEY (missing private key punctuated) --strict keeps period', async ct => {
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Get.prototype, 'run')
  const error = new Error('[MISSING_PRIVATE_KEY] punctuated')
  setCode(error, 'MISSING_PRIVATE_KEY')
  stub.returns({ parsed: { HELLO: 'World' }, errors: [error] })
  const processExitStub = sinon.stub(process, 'exit')
  const { stderr } = await captureStdio(async () => {
    await get.call(fakeContext, 'HELLO')
  })

  t.ok(stub.called, 'Get().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(stderr.includes('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  ct.end()
})
