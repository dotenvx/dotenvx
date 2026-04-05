const t = require('tap')
const fsx = require('./../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const Rotate = require('./../../../src/lib/services/rotate')
const { logger } = require('../../../src/shared/logger')

const rotate = proxyquire('../../../src/cli/actions/rotate', {
  '../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

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

let writeStub

t.beforeEach((ct) => {
  sinon.restore()
  writeStub = sinon.stub(fsx, 'writeFileX')
})

t.test('rotate - nothing', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')

  ct.end()
})

t.test('rotate - .env but no change', async ct => {
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
  const loggerNeutralStub = sinon.stub(logger, 'info')

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger.info')

  ct.end()
})

t.test('rotate - --stdout', async ct => {
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

  const stdout = await captureStdout(async () => {
    await rotate.call(fakeContext)
  })

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(processExitStub.calledWith(0), 'process.exit(0)')
  t.equal(stdout, 'HELLO="encrypted:1234"\n\nDOTENV_PRIVATE_KEY=previous,newPrivateKey\n')

  ct.end()
})

t.test('rotate - .env with changes', async ct => {
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="encrypted:1234"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('rotated .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('⟳ rotated (.env) + key (.env.keys)'), 'logger.success')

  ct.end()
})

t.test('rotate - .env with changes and privateKeyAdded', async ct => {
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

  await rotateNotIgnoring.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.calledWith('.env', 'HELLO="encrypted:1234"'), 'fsx.writeFileX')
  t.ok(loggerVerboseStub.calledWith('rotated .env (.env)'), 'logger.verbose')
  t.ok(loggerSuccessStub.calledWith('⟳ rotated (.env) + key (.env.keys)'), 'logger.success')

  ct.end()
})

t.test('rotate - MISSING_ENV_FILE', async ct => {
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - MISSING_ENV_FILE fallback filepath', async ct => {
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const loggerWarnStub = sinon.stub(logger, 'warn')
  sinon.stub(Rotate.prototype, 'run').returns({
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

  await rotate.call(fakeContext)

  t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger.warn fallback .env path')
  ct.end()
})

t.test('rotate - OTHER_ERROR', async ct => {
  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  error.help = 'some help'
  error.messageWithHelp = 'Mock Error'
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - MISPAIRED_PRIVATE_KEY', async ct => {
  const error = new Error("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…)")
  error.code = 'MISPAIRED_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/752]'
  error.messageWithHelp = "[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…). fix: [https://github.com/dotenvx/dotenvx/issues/752]"
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…). fix: [https://github.com/dotenvx/dotenvx/issues/752]"), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - WRONG_PRIVATE_KEY', async ct => {
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  error.code = 'WRONG_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  error.messageWithHelp = "[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - MISSING_PRIVATE_KEY', async ct => {
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  error.code = 'MISSING_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  error.messageWithHelp = "[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"
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
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('rotate - INVALID_PUBLIC_KEY', async ct => {
  const error = new Error("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'")
  error.code = 'INVALID_PUBLIC_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/756]'
  error.messageWithHelp = "[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(loggerInfoStub.notCalled, 'logger.info')
  t.ok(loggerVerboseStub.calledWith('rotating .env (.env)'), 'logger.verbose')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerWarnStub.calledWith("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"), 'logger.warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessStub.notCalled, 'logger.success')

  ct.end()
})

t.test('rotate - preserves already punctuated error messages', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const loggerWarnStub = sinon.stub(logger, 'warn')
  sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [{
      envFilepath: '.env',
      filepath: '.env',
      error: { code: 'WRONG_PRIVATE_KEY', message: '[WRONG_PRIVATE_KEY] already punctuated', messageWithHelp: '[WRONG_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/466]' },
      changed: false,
      envSrc: ''
    }, {
      envFilepath: '.env',
      filepath: '.env',
      error: { code: 'MISSING_PRIVATE_KEY', message: '[MISSING_PRIVATE_KEY] already punctuated', messageWithHelp: '[MISSING_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/464]' },
      changed: false,
      envSrc: ''
    }, {
      envFilepath: '.env',
      filepath: '.env',
      error: { code: 'INVALID_PUBLIC_KEY', message: '[INVALID_PUBLIC_KEY] already punctuated', messageWithHelp: '[INVALID_PUBLIC_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/756]' },
      changed: false,
      envSrc: ''
    }, {
      envFilepath: '.env',
      filepath: '.env',
      error: { code: 'MISPAIRED_PRIVATE_KEY', message: '[MISPAIRED_PRIVATE_KEY] already punctuated', messageWithHelp: '[MISPAIRED_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/752]' },
      changed: false,
      envSrc: ''
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await rotate.call(fakeContext)

  t.ok(loggerWarnStub.calledWith('[WRONG_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  t.ok(loggerWarnStub.calledWith('[MISSING_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  t.ok(loggerWarnStub.calledWith('[INVALID_PUBLIC_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/756]'))
  t.ok(loggerWarnStub.calledWith('[MISPAIRED_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/752]'))
  ct.end()
})

t.test('rotate - catch error', async ct => {
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.messageWithHelp = 'Mock Error. Mock Help'
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

  await rotate.call(fakeContext)

  t.ok(stub.called, 'Rotate().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.notCalled, 'logger success')
  t.ok(loggerErrorStub.calledWith('Mock Error. Mock Help'), 'logger error')
  t.ok(loggerHelpStub.notCalled, 'logger help')
  t.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger debug')
  t.ok(loggerDebugStub.calledWith('ERROR_CODE: 500'), 'logger debug')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('rotate - --no-ops passes noOps true to Rotate service', async ct => {
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const runStub = sinon.stub(Rotate.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await rotate.call(fakeContext)

  t.ok(runStub.calledOnce, 'Rotate().run() called')
  t.equal(runStub.thisValues[0].noOps, true, 'noOps true')

  ct.end()
})

t.test('rotate - spinner stop is called for stdout/success/catch flows', async ct => {
  const stopStub = sinon.stub()
  const createSpinnerStub = sinon.stub().resolves({ stop: stopStub })
  const sessionStub = sinon.stub().resolves(false)
  const catchAndLogStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')

  class SessionMock {
    async noOps () {
      return sessionStub()
    }
  }

  class RotateMock {
    async run () {
      return {
        processedEnvs: [],
        changedFilepaths: [],
        unchangedFilepaths: []
      }
    }
  }

  const rotateWithSpinner = proxyquire('../../../src/cli/actions/rotate', {
    './../../lib/services/rotate': RotateMock,
    '../../lib/helpers/createSpinner': createSpinnerStub,
    '../../lib/helpers/catchAndLog': catchAndLogStub,
    '../../db/session': SessionMock
  })

  await rotateWithSpinner.call({ opts: () => ({ stdout: true }), envs: [] })
  ct.equal(stopStub.callCount, 1, 'stops spinner in stdout flow')

  await rotateWithSpinner.call({ opts: () => ({}), envs: [] })
  ct.equal(stopStub.callCount, 2, 'stops spinner in success flow')

  class RotateThrowsMock {
    async run () {
      throw new Error('boom')
    }
  }

  const rotateWithSpinnerAndError = proxyquire('../../../src/cli/actions/rotate', {
    './../../lib/services/rotate': RotateThrowsMock,
    '../../lib/helpers/createSpinner': createSpinnerStub,
    '../../lib/helpers/catchAndLog': catchAndLogStub,
    '../../db/session': SessionMock
  })

  await rotateWithSpinnerAndError.call({ opts: () => ({}), envs: [] })
  ct.equal(stopStub.callCount, 3, 'stops spinner in catch flow')
  ct.ok(catchAndLogStub.calledOnce, 'catchAndLog called in catch flow')
  ct.ok(processExitStub.calledWith(1), 'process.exit(1) called in catch flow')
  ct.end()
})
