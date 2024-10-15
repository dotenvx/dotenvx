const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const main = require('../../../src/lib/main')
const { logger } = require('../../../src/shared/logger')

const set = proxyquire('../../../src/cli/actions/set', {
  '../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('set - no changes', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error: null
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })
  const loggerInfoStub = sinon.stub(logger, 'info')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')

  ct.end()
})

t.test('set - changes', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')

  ct.end()
})

t.test('set - no changes and no unchanged', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')

  ct.end()
})

t.test('set - MISSING_ENV_FILE', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'

  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
  t.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and re-run [dotenvx set]'), 'logger help')

  ct.end()
})

t.test('set - OTHER_ERROR', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  error.help = 'some help'

  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
  t.ok(loggerHelpStub.calledWith('some help'), 'logger.help')

  ct.end()
})

t.test('set - changes --plain', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({ plain: true })
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO (.env)'), 'logger success')

  ct.end()
})

t.test('set - privateKeyAdded', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: '1234',
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelp2Stub = sinon.stub(logger, 'help2')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')
  t.ok(loggerSuccessStub.calledWith('✔ key added to .env.keys (DOTENV_PRIVATE_KEY)'), 'logger success')
  t.ok(loggerHelp2Stub.calledWith('ℹ run [DOTENV_PRIVATE_KEY=\'1234\' dotenvx get HELLO] to test decryption locally'), 'logger help2')

  ct.end()
})

t.test('set - privateKeyAdded and not ignoring .env.keys', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const setNotIgnoring = proxyquire('../../../src/cli/actions/set', {
    '../../../src/lib/helpers/isIgnoringDotenvKeys': () => false
  })
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: '1234',
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelp2Stub = sinon.stub(logger, 'help2')

  setNotIgnoring.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')
  t.ok(loggerSuccessStub.calledWith('✔ key added to .env.keys (DOTENV_PRIVATE_KEY)'), 'logger success')
  t.ok(loggerHelp2Stub.calledWith('ℹ add .env.keys to .gitignore: [echo ".env.keys" >> .gitignore]'), 'logger help2')
  t.ok(loggerHelp2Stub.calledWith('ℹ run [DOTENV_PRIVATE_KEY=\'1234\' dotenvx get HELLO] to test decryption locally'), 'logger help2')

  ct.end()
})

t.test('set - catch error', ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(main, 'set').throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'main.set() called')
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
