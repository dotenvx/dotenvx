const t = require('tap')
const sinon = require('sinon')

const precommit = require('../../../../src/cli/actions/ext/precommit')

const { logger } = require('../../../../src/shared/logger')
const Precommit = require('../../../../src/lib/services/precommit')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('precommit - successMessage', (ct) => {
  // Stub the Precommit service
  sinon.stub(Precommit.prototype, 'run').returns({
    successMessage: 'success',
    warnings: []
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')

  precommit.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.success logs')

  ct.end()
})

t.test('precommit - success with warnings', (ct) => {
  const warning = new Error('.gitignore missing')
  warning.help = '? add it with [touch .gitignore]'
  // Stub the Precommit service
  sinon.stub(Precommit.prototype, 'run').returns({
    successMessage: 'success (with 1 warning)',
    warnings: [warning]
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  precommit.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success (with 1 warning)'), 'logger.success logs')
  ct.ok(loggerWarnStub.calledWith('.gitignore missing'), 'logger.warn logs')
  ct.ok(loggerHelpStub.calledWith('? add it with [touch .gitignore]'), 'logger.help logs')

  ct.end()
})

t.test('precommit - error raised', (ct) => {
  sinon.stub(Precommit.prototype, 'run').throws({
    message: 'An error occurred',
    help: 'Help message for error'
  })

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  precommit.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('An error occurred'), 'logger.success logs')
  ct.ok(loggerHelpStub.calledWith('Help message for error'), 'logger.help logs')

  ct.end()
})
