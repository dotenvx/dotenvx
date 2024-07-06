const t = require('tap')
const sinon = require('sinon')

const { logger } = require('../../../../../src/shared/logger')

const main = require('./../../../../../src/lib/main')
const status = require('../../../../../src/cli/actions/ext/vault/status')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('status', ct => {
  const stub = sinon.stub(main, 'status').returns({
    changes: [],
    nochanges: [{
      filename: '.env',
      filepath: '.env',
      environment: 'development'
    }],
    untracked: [{
      filename: '.env.untracked',
      filepath: '.env.untracked',
      environment: 'untracked'
    }]
  })

  status.call(fakeContext, '.')

  ct.ok(stub.called, 'main.status() called')

  ct.end()
})

t.test('status - when no .env* files', ct => {
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const stub = sinon.stub(main, 'status').returns({
    changes: [],
    nochanges: [],
    untracked: [{
      filename: '.env.untracked',
      filepath: '.env.untracked',
      environment: 'untracked'
    }]
  })

  status.call(fakeContext, '.')

  ct.ok(stub.called, 'main.status() called')
  ct.ok(loggerWarnStub.calledWith('no .env* files.'), 'logger.warn called')
  ct.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and then run [dotenvx status]'), 'logger.help called')

  ct.end()
})

t.test('status - when changes', ct => {
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerBlankStub = sinon.stub(logger, 'blank')

  const stub = sinon.stub(main, 'status').returns({
    changes: [{
      filename: '.env.production',
      filepath: '.env.production',
      environment: 'production',
      coloredDiff: 'HELLO=production'
    }],
    nochanges: [],
    untracked: []
  })

  status.call(fakeContext, '.')

  ct.ok(stub.called, 'main.status() called')

  ct.ok(loggerWarnStub.calledWith('changes (.env.production)'), 'logger.warn called')
  ct.ok(loggerBlankStub.calledWith('run [dotenvx encrypt] to apply changes to .env.vault'), 'logger.blank called')

  ct.end()
})

t.test('status - when changes to a different directory', ct => {
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerBlankStub = sinon.stub(logger, 'blank')

  const stub = sinon.stub(main, 'status').returns({
    changes: [{
      filename: '.env.production',
      filepath: '.env.production',
      environment: 'production',
      coloredDiff: 'HELLO=production'
    }],
    nochanges: [],
    untracked: []
  })

  status.call(fakeContext, 'directory')

  ct.ok(stub.called, 'main.status() called')

  ct.ok(loggerWarnStub.calledWith('changes (.env.production)'), 'logger.warn called')
  ct.ok(loggerBlankStub.calledWith('run [dotenvx encrypt directory] to apply changes to .env.vault'), 'logger.blank called')

  ct.end()
})

t.test('status - when error', ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const error = new Error('Mock Error')
  error.code = 500
  error.help = 'Mock Help'
  error.debug = 'Mock Debug'

  const stub = sinon.stub(main, 'status').throws(error)

  status.call(fakeContext, '.')

  ct.ok(stub.called, 'main.status() called')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error called')
  ct.ok(loggerHelpStub.calledWith('Mock Help'), 'logger.help called')
  ct.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger.debug called')

  ct.end()
})
