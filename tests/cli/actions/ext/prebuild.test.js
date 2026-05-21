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
  warning.messageWithHelp = '.dockerignore missing. fix: [touch .dockerignore]'
  // Stub the Prebuild service
  sinon.stub(Prebuild.prototype, 'run').returns({
    successMessage: 'success (with 1 warning)',
    warnings: [warning]
  })

  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  prebuild.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success (with 1 warning)'), 'logger.success logs')
  ct.ok(loggerWarnStub.calledWith('.dockerignore missing. fix: [touch .dockerignore]'), 'logger.warn logs')

  ct.end()
})

t.test('prebuild - error raised', (ct) => {
  sinon.stub(Prebuild.prototype, 'run').throws({
    message: 'An error occurred',
    messageWithHelp: 'An error occurred. fix: [https://github.com/dotenvx/dotenvx/issues/NEEDED]'
  })

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')

  prebuild.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('An error occurred. fix: [https://github.com/dotenvx/dotenvx/issues/NEEDED]'), 'logger.success logs')

  ct.end()
})
