const t = require('tap')
const fsx = require('../../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const capcon = require('capture-console')
const proxyquire = require('proxyquire')

const Unlock = require('../../../../src/lib/services/unlock')
const { logger } = require('../../../../src/shared/logger')
const { stubLoggers, allLoggerNames, showLoggerCalls } = require('../../../utils/showLoggerCalls')
const Errors = require('../../../../src/lib/helpers/errors')

const unlock = proxyquire('../../../../src/cli/actions/ext/unlock', {
  '../../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

/** @typedef {import('../../../utils/showLoggerCalls').SinonStubbedLoggerSet} SinonStubbedLoggerSet */

let writeStub
/** @type {SinonStubbedLoggerSet} */
let loggerStubs

t.beforeEach((ct) => {
  sinon.restore()
  writeStub = sinon.stub(fsx, 'writeFileX')
  // logger.setLevel('debug')
})

t.afterEach((ct) => {
  loggerStubs = {}
})

// ============================================================================================
t.test('unlock action - INVALID_ARGUMENTS', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const invalidArgumentsError = new Errors({ command: 'unlock' }).invalidArguments()
  invalidArgumentsError.help = 'Mock help'
  // stub replacement for Unlock.run()
  const stub = sinon.stub(Unlock.prototype, 'run').returns({
    processedEnvs: [{ error: invalidArgumentsError }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  // logger.setLevel('silly')
  const isSillyLogger = (logger.level === 'silly')

  /* SILLY */ logger.silly(`| === ${ct.name} logger stub calls:`)

  loggerStubs = stubLoggers(allLoggerNames, isSillyLogger)

  if (!isSillyLogger) {
    unlock.call(fakeContext)
  } else {
    /* SILLY */ // show all logger calls, as well as stdout and stderr
    /* SILLY */ const { stdout, stderr } = capcon.interceptStdio(() => {
      /* SILLY */ unlock.call(fakeContext)
    /* SILLY */
    /* SILLY */
    /* SILLY */ })
    /* SILLY */ sinon.restore()
    /* SILLY */ console.log('STDOUT 1:', stdout)
    /* SILLY */ console.log('STDERR 1:', stderr)
    /* SILLY */ showLoggerCalls(loggerStubs, ct.name)
  }

  t.ok(loggerStubs.error.calledWithMatch('[INVALID_ARGUMENTS] invalid arguments provided for action unlock'), 'logger.error called for invalid arguments')
  t.ok(stub.called, 'Unlock().run() called')
  t.ok(loggerStubs.debug.calledWithMatch('unlock action called'), 'logger.debug called for unlock action')
  t.ok(loggerStubs.debug.calledWithMatch('about to call new Unlock(...).run()'), 'logger.debug called before Unlock.run()')
  t.ok(loggerStubs.debug.calledWithMatch('Unlock.run() completed returning processedEnvs: [{"error":{"code":"INVALID_ARGUMENTS","help":"Mock help"}}]'), 'logger.debug called after Unlock.run() returned invalid arguments')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  logger.silly(`| ====== end of test: ${ct.name} ======`)

  ct.end()
})

// ============================================================================================
t.test('unlock action - MISSING_ENV_FILE', ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const missingEnvFileError = new Errors({ envFilepath: '.env', filepath: '/path/to/.env' }).missingEnvFile()
  // stub replacement for Unlock.run()
  const stub = sinon.stub(Unlock.prototype, 'run').returns({
    processedEnvs: [{ error: missingEnvFileError, help: '(help goes here)' }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  // logger.setLevel('silly')
  const isSillyLogger = (logger.level === 'silly')

  /* SILLY */ logger.silly(`| === ${ct.name} logger stub calls:`)

  loggerStubs = stubLoggers(allLoggerNames, isSillyLogger)

  if (!isSillyLogger) {
    unlock.call(fakeContext)
  } else {
    /* SILLY */ // show all logger calls, as well as stdout and stderr
    /* SILLY */ const { stdout, stderr } = capcon.interceptStdio(() => {
    /* SILLY */ unlock.call(fakeContext)
    /* SILLY */
    /* SILLY */
    /* SILLY */ })
    /* SILLY */ sinon.restore()
    /* SILLY */ console.log('STDOUT 1:', stdout)
    /* SILLY */ console.log('STDERR 1:', stderr)
    /* SILLY */ showLoggerCalls(loggerStubs, ct.name)
  }

  t.ok(stub.called, 'Unlock().run() called')
  t.ok(loggerStubs.error.calledWithMatch('[MISSING_ENV_FILE] missing .env file (/path/to/.env)'), 'logger.error called for missing env file')
  t.ok(loggerStubs.help.calledWithMatch('? add one with [echo "HELLO=World" > undefined] and re-run [dotenvx set]'), 'logger.help called for missing env file')
  t.ok(loggerStubs.help.calledWithMatch('[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'), 'logger.help called for missing env file')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  logger.silly(`| ====== end of test: ${ct.name} ======`)

  ct.end()
})
// ============================================================================================
t.test('unlock action - MULTIPLE ENVS', ct => {
  const optsStub = sinon.stub().returns({ envKeysFile: '.env.keys', salt: 'justAPinch' })
  const fakeContext = { opts: optsStub, envs: ['development', 'production'] }
  // stub replacement for Unlock.run()
  const stub = sinon.stub(Unlock.prototype, 'run').returns({
    processedEnvs: [
      { unlocked: true, envKeysFilepath: '/path/to/.env.keys.development', privateKeyName: 'DOTENVX_PRIVATE_KEY_DEVELOPMENT' },
      { unlocked: true, envKeysFilepath: '/path/to/.env.keys.production', privateKeyName: 'DOTENVX_PRIVATE_KEY_PRODUCTION' }
    ],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  // logger.setLevel('silly')
  const isSillyLogger = (logger.level === 'silly')

  /* SILLY */ logger.silly(`| === ${ct.name} logger stub calls:`)

  loggerStubs = stubLoggers(allLoggerNames, isSillyLogger)

  if (!isSillyLogger) {
    unlock.call(fakeContext, 'myPassphrase')
  } else {
    /* SILLY */ // show all logger calls, as well as stdout and stderr
    /* SILLY */ const { stdout, stderr } = capcon.interceptStdio(() => {
    /* SILLY */ unlock.call(fakeContext, 'myPassphrase')
    /* SILLY */
    /* SILLY */
    /* SILLY */ })
    /* SILLY */ sinon.restore()
    /* SILLY */ console.log('STDOUT 1:', stdout)
    /* SILLY */ console.log('STDERR 1:', stderr)
    /* SILLY */ showLoggerCalls(loggerStubs, ct.name)
  }

  t.ok(stub.called, 'Unlock().run() called')
  t.ok(loggerStubs.success.calledWithMatch('✔ /path/to/.env.keys.development (DOTENVX_PRIVATE_KEY_DEVELOPMENT) unlocked'), 'logger.success called')
  t.ok(loggerStubs.success.calledWithMatch('✔ /path/to/.env.keys.production (DOTENVX_PRIVATE_KEY_PRODUCTION) unlocked'), 'logger.success called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  logger.silly(`| ====== end of test: ${ct.name} ======`)

  ct.end()
})
// ============================================================================================
t.test('unlock action - CATCH ERROR', ct => {
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Unlock.prototype, 'run').throws(error)

  // logger.setLevel('silly')
  const isSillyLogger = (logger.level === 'silly')

  /* SILLY */ logger.silly(`| === ${ct.name} logger stub calls:`)

  loggerStubs = stubLoggers(allLoggerNames, isSillyLogger)
  const processExitStub = sinon.stub(process, 'exit')

  if (!isSillyLogger) {
    unlock.call(fakeContext, 'myPassphrase')
  } else {
    /* SILLY */ // show all logger calls, as well as stdout and stderr
    /* SILLY */ const { stdout, stderr } = capcon.interceptStdio(() => {
    /* SILLY */ unlock.call(fakeContext, 'myPassphrase')
    /* SILLY */
    /* SILLY */
    /* SILLY */ })
    /* SILLY */ sinon.restore()
    /* SILLY */ console.log('STDOUT 1:', stdout)
    /* SILLY */ console.log('STDERR 1:', stderr)
    /* SILLY */ showLoggerCalls(loggerStubs, ct.name)
  }

  t.ok(stub.called, 'Unlock().run() called')
  t.ok(loggerStubs.error.calledWith('Mock Error'), 'logger error')
  t.ok(loggerStubs.help.calledWith('Mock Help'), 'logger help')
  t.ok(loggerStubs.debug.calledWith('Mock Debug'), 'logger debug')
  t.ok(loggerStubs.debug.calledWith('ERROR_CODE: 500'), 'logger debug')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  logger.silly(`| ====== end of test: ${ct.name} ======`)

  ct.end()
})
