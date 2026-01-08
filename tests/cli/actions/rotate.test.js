const t = require('tap')
const fsx = require('./../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const capcon = require('capture-console')
const proxyquire = require('proxyquire')

const Rotate = require('./../../../src/lib/services/rotate')
const { logger } = require('../../../src/shared/logger')

const rotate = proxyquire('../../../src/cli/actions/rotate', {
  '../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

let writeStub

t.beforeEach((ct) => {
  sinon.restore()
  writeStub = sinon.stub(fsx, 'writeFileX')
})

t.test('rotate - nothing', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')

  ct.end()
})

t.test('rotate - .env but no changes', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: false,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: null,
      privateKeyName: null,
      privateKey: null
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })
  const loggerInfoStub = sinon.stub(logger, 'info')

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger.info')

  ct.end()
})

t.test('rotate - --stdout', ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const optsStub = sinon.stub().returns({ stdout: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: true,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'newPrivateKey',
      envKeysSrc: 'DOTENV_PRIVATE_KEY=previous,newPrivateKey'
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })

  const stdout = capcon.interceptStdout(() => {
    rotate.call(fakeContext)
  })

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(processExitStub.calledWith(0), 'process.exit(0)')
  t.equal(stdout, 'HELLO="encrypted:1234"\n\nDOTENV_PRIVATE_KEY=previous,newPrivateKey\n')

  ct.end()
})

t.test('rotate - .env with changes', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: true,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'newPrivateKey',
      envKeysSrc: 'DOTENV_PRIVATE_KEY=previous,newPrivateKey'
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="encrypted:1234"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('rotated .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('✔ rotated (.env)'), 'logger.success')

  ct.end()
})

t.test('rotate - .env with changes and privateKeyAdded but not ignoring .env.keys', ct => {
  const rotateNotIgnoring = proxyquire('../../../src/cli/actions/rotate', {
    '../../../src/lib/helpers/isIgnoringDotenvKeys': () => false
  })

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: null,
      changed: true,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: 'newPrivateKey',
      envKeysSrc: 'DOTENV_PRIVATE_KEY=previous,newPrivateKey'
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelpStub = sinon.stub(logger, 'help')

  rotateNotIgnoring.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="encrypted:1234"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('rotated .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('✔ rotated (.env)'), 'logger.success')
  t.ok(loggerSuccessStub.calledWith('✔ key added to .env.keys (DOTENV_PRIVATE_KEY)'), 'logger success')
  t.ok(loggerHelpStub.calledWith('⮕  optional: [dotenvx ops backup] to securely backup private key'), 'logger help')
  t.ok(loggerHelpStub.calledWith('⮕  next run: [dotenvx ext gitignore --pattern .env.keys] to gitignore .env.keys'), 'logger help')
  t.ok(loggerHelpStub.calledWith('⮕  next run: [DOTENV_PRIVATE_KEY=\'newPrivateKey\' dotenvx get] to test decryption locally'), 'logger help')

  ct.end()
})

t.test('rotate - MISSING_ENV_FILE', ct => {
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: null,
      privateKeyName: null,
      privateKey: null
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger.warn')
  t.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and re-run [dotenvx rotate]'), 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - OTHER_ERROR', ct => {
  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  error.help = 'some help'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error,
      changed: true,
      envSrc: 'HELLO="encrypted:1234"',
      privateKeyAdded: null,
      privateKeyName: null,
      privateKey: null
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger.warn')
  t.ok(loggerHelpStub.calledWith('some help'), 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - catch error', ct => {
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
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
