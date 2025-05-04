const t = require('tap')
const fsx = require('./../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const capcon = require('capture-console')

const Decrypt = require('./../../../src/lib/services/decrypt')
const { logger } = require('../../../src/shared/logger')

const decrypt = require('./../../../src/cli/actions/decrypt')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('decrypt - nothing', ct => {
  sinon.stub(process, 'exit')
  sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Decrypt.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')

  ct.end()
})

t.test('decrypt - .env but no changes', ct => {
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
  const loggerInfoStub = sinon.stub(logger, 'info')

  decrypt.call(fakeContext)

  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger.info')

  ct.end()
})

t.test('decrypt - --stdout', ct => {
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

  const stdout = capcon.interceptStdout(() => {
    decrypt.call(fakeContext)
  })

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(processExitStub.calledWith(0), 'process.exit(0)')
  t.equal(stdout, 'HELLO="World"\n')

  ct.end()
})

t.test('decrypt - --stdout with error', ct => {
  sinon.stub(fsx, 'writeFileX')
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
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

  capcon.interceptStderr(() => {
    decrypt.call(fakeContext)
  })

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.ok(loggerErrorStub.calledWith('https://github.com/dotenvx/dotenvx'), 'logger.error')

  ct.end()
})

t.test('decrypt - .env with changes', ct => {
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

  decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="World"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('decrypted .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('✔ decrypted (.env)'), 'logger.success')

  ct.end()
})

t.test('decrypt - MISSING_ENV_FILE', ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
  error.code = 'MISSING_ENV_FILE'
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

  decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and re-run [dotenvx decrypt]'), 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('decrypt - OTHER_ERROR', ct => {
  sinon.stub(process, 'exit')
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'https://github.com/dotenvx/dotenvx'
  error.code = 'OTHER_ERROR'
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

  decrypt.call(fakeContext)

  t.ok(stub.called, 'Decrypt().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('decrypting .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.ok(loggerErrorStub.calledWith('https://github.com/dotenvx/dotenvx'), 'logger.error')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('decrypt - catch error', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  sinon.stub(Decrypt.prototype, 'run').throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  decrypt.call(fakeContext)

  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.notCalled, 'logger success')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger error')
  t.ok(loggerHelpStub.calledWith('Mock Help'), 'logger help')
  t.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger debug')
  t.ok(loggerDebugStub.calledWith('ERROR_CODE: 500'), 'logger debug')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})
