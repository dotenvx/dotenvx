const t = require('tap')
const sinon = require('sinon')

const prebuild = require('../../../../src/cli/actions/ext/prebuild')

const { logger } = require('../../../../src/shared/logger')
const Prebuild = require('../../../../src/lib/services/prebuild')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('prebuild - successMessage', (ct) => {
  // Stub the Prebuild service
  sinon.stub(Prebuild.prototype, 'run').returns({
    successMessage: 'success',
    warnings: []
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')

  prebuild.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.success logs')

  ct.end()
})

t.test('prebuild - success with warnings', (ct) => {
  const warning = new Error('.dockerignore missing')
  warning.help = '? add it with [touch .dockerignore]'
  // Stub the Prebuild service
  sinon.stub(Prebuild.prototype, 'run').returns({
    successMessage: 'success (with 1 warning)',
    warnings: [warning]
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  prebuild.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success (with 1 warning)'), 'logger.success logs')
  ct.ok(loggerWarnStub.calledWith('.dockerignore missing'), 'logger.warn logs')
  ct.ok(loggerHelpStub.calledWith('? add it with [touch .dockerignore]'), 'logger.help logs')

  ct.end()
})

t.test('prebuild - error raised', (ct) => {
  sinon.stub(Prebuild.prototype, 'run').throws({
    message: 'An error occurred',
    help: 'Help message for error'
  })

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  prebuild.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('An error occurred'), 'logger.success logs')
  ct.ok(loggerHelpStub.calledWith('Help message for error'), 'logger.help logs')

  ct.end()
})
