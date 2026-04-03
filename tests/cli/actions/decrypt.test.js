const t = require('tap')
const fsx = require('./../../../src/lib/helpers/fsx')
const sinon = require('sinon')

const Decrypt = require('./../../../src/lib/services/decrypt')
const { logger } = require('../../../src/shared/logger')

const decrypt = require('./../../../src/cli/actions/decrypt')

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

async function captureStderr (fn) {
  let stderr = ''
  const stderrWrite = process.stderr.write
  process.stderr.write = function (chunk, encoding, callback) {
    stderr += Buffer.isBuffer(chunk) ? chunk.toString() : chunk
    if (typeof callback === 'function') callback()
    return true
  }

  try {
    await fn()
  } finally {
    process.stderr.write = stderrWrite
  }

  return stderr
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('decrypt - nothing', async ct => {
  sinon.stub(process, 'exit')
  sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')

  ct.end()
})

t.test('decrypt - .env but no change', async ct => {
  sinon.stub(fsx, 'writeFileX')
  sinon.stub(process, 'exit')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: false,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })
  const loggerNeutralStub = sinon.stub(logger, 'info')

  await decrypt.call(fakeContext)

  t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger.info')

  ct.end()
})

t.test('decrypt - --stdout', async ct => {
  sinon.stub(fsx, 'writeFileX')
  const processExitStub = sinon.stub(process, 'exit')
  const optsStub = sinon.stub().returns({ stdout: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: false,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  const stdout = await captureStdout(async () => {
    await decrypt.call(fakeContext)
  })

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(processExitStub.calledWith(0), 'process.exit(0)')
  t.equal(stdout, 'HELLO="World"\n')

  ct.end()
})

t.test('decrypt - --stdout with error', async ct => {
  sinon.stub(fsx, 'writeFileX')
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
  error.messageWithHelp = 'Mock Error'
  const optsStub = sinon.stub().returns({ stdout: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: false,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  await captureStderr(async () => {
    await decrypt.call(fakeContext)
  })

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('https://github.com/dotenvx/dotenvx'), 'no separate help line')

  ct.end()
})

t.test('decrypt - .env with changes', async ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: true,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="World"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('decrypted .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('◇ decrypted (.env)'), 'logger.success')

  ct.end()
})

t.test('decrypt - MISSING_ENV_FILE', async ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger.error')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('decrypt - MISSING_ENV_FILE fallback filepath', async ct => {
  sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: undefined,
      filepath: undefined,
      error,
      changed: false,
      envSrc: ''
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await decrypt.call(fakeContext)

  t.ok(loggerErrorStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger.error fallback .env path')
  ct.end()
})

t.test('decrypt - OTHER_ERROR', async ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
  error.code = 'OTHER_ERROR'
  error.messageWithHelp = 'Mock Error'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('https://github.com/dotenvx/dotenvx'), 'no separate help line')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('decrypt - WRONG_PRIVATE_KEY', async ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  error.code = 'WRONG_PRIVATE_KEY'
  error.messageWithHelp = "[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerErrorStub = sinon.stub(logger, 'error')

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'logger.error does not print separate help line')

  ct.end()
})

t.test('decrypt - MISSING_PRIVATE_KEY', async ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  error.code = 'MISSING_PRIVATE_KEY'
  error.messageWithHelp = "[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerErrorStub = sinon.stub(logger, 'error')

  await decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'logger.error does not print separate help line')

  ct.end()
})

t.test('decrypt - MISSING_PRIVATE_KEY/WRONG_PRIVATE_KEY fallback base messages', async ct => {
  sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const missingPrivateKey = new Error('')
  missingPrivateKey.message = ''
  missingPrivateKey.code = 'MISSING_PRIVATE_KEY'
  missingPrivateKey.messageWithHelp = '[MISSING_PRIVATE_KEY] could not decrypt fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  const wrongPrivateKey = new Error('')
  wrongPrivateKey.message = ''
  wrongPrivateKey.code = 'WRONG_PRIVATE_KEY'
  wrongPrivateKey.messageWithHelp = '[WRONG_PRIVATE_KEY] could not decrypt fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: missingPrivateKey,
      changed: false,
      envSrc: ''
    }, {
      envFilepath: '.env',
      filepath: '.env',
      error: wrongPrivateKey,
      changed: false,
      envSrc: ''
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await decrypt.call(fakeContext)

  t.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] could not decrypt fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  t.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] could not decrypt fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  ct.end()
})

t.test('decrypt - --stdout with WRONG_PRIVATE_KEY', async ct => {
  sinon.stub(fsx, 'writeFileX')
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  error.code = 'WRONG_PRIVATE_KEY'
  error.messageWithHelp = "[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"
  const optsStub = sinon.stub().returns({ stdout: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: false,
      envSrc: 'HELLO="World"'
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  await captureStderr(async () => {
    await decrypt.call(fakeContext)
  })

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'logger.error does not print separate help line')

  ct.end()
})

t.test('decrypt - catch error', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500
  error.messageWithHelp = 'Mock Error'

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  sinon.stub(Decrypt.prototype, 'run').throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await decrypt.call(fakeContext)

  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.notCalled, 'logger success')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger error')
  t.ok(loggerHelpStub.notCalled, 'logger help')
  t.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger debug')
  t.ok(loggerDebugStub.calledWith('ERROR_CODE: 500'), 'logger debug')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('decrypt - --no-ops passes opsOn false to Decrypt service', async ct => {
  sinon.stub(process, 'exit')
  sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const runStub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await decrypt.call(fakeContext)

  t.ok(runStub.calledOnce, 'Decrypt().run() called')
  t.equal(runStub.thisValues[0].opsOn, false, 'opsOn false')

  ct.end()
})
