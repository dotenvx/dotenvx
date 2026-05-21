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
  warning.messageWithHelp = '.gitignore missing. fix: [touch .gitignore]'
  // Stub the Precommit service
  sinon.stub(Precommit.prototype, 'run').returns({
    successMessage: 'success (with 1 warning)',
    warnings: [warning]
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  precommit.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success (with 1 warning)'), 'logger.success logs')
  ct.ok(loggerWarnStub.calledWith('.gitignore missing. fix: [touch .gitignore]'), 'logger.warn logs')

  ct.end()
})

t.test('precommit - error raised', (ct) => {
  sinon.stub(Precommit.prototype, 'run').throws({
    message: 'An error occurred',
    messageWithHelp: 'An error occurred. fix: [https://github.com/dotenvx/dotenvx/issues/NEEDED]'
  })

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')

  precommit.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('An error occurred. fix: [https://github.com/dotenvx/dotenvx/issues/NEEDED]'), 'logger.success logs')

  ct.end()
})
