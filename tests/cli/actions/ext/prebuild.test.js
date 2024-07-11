const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const { logger } = require('../../../../src/shared/logger')

const prebuild = require('../../../../src/cli/actions/ext/prebuild')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('prebuild - .dockerignore file missing', (ct) => {
  sinon.stub(fs, 'existsSync').returns(false)
  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help2')

  prebuild.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('.dockerignore missing'), 'logger.errorvpb should log the missing .dockerignore file')
  ct.ok(loggerHelpStub.calledWith('? add it with [touch .dockerignore]'), 'add it with [touch .dockerignore]')

  ct.end()
})

t.test('prebuild - .dockerignore empty but no .env* files', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('')

  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore empty but .env file', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('')
  sinon.stub(fs, 'readdirSync').returns(['.env'])

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerHelpStub = sinon.stub(logger, 'help2')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('.env not properly dockerignored'), '.env not properly dockerignored')
  ct.ok(loggerHelpStub.calledWith('? add .env to .dockerignore with [echo ".env*" >> .dockerignore]'), 'add .env to dockerignore')
  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore empty but .env.example file', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('')
  sinon.stub(fs, 'readdirSync').returns(['.env.example'])

  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  sinon.assert.notCalled(loggerErrorStub) // nothing happens
  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore ignoring .env.example but .env.example file', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('.env*') // effectively ignores .env.example
  sinon.stub(fs, 'readdirSync').returns(['.env.example'])

  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerWarnStub = sinon.stub(logger, 'warnv')
  const loggerHelpStub = sinon.stub(logger, 'help2')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  sinon.assert.notCalled(loggerErrorStub) // nothing happens
  ct.ok(loggerWarnStub.calledWith('.env.example (currently ignored but should not be)'), 'currently ignored but should not be')
  ct.ok(loggerHelpStub.calledWith('? add !.env.example to .dockerignore with [echo "!.env.example" >> .dockerignore]'), 'add !.env.example to dockerignore')
  ct.ok(loggerSuccessStub.calledWith('success (with warning)'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore empty but .env.vault file', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('')
  sinon.stub(fs, 'readdirSync').returns(['.env.vault'])

  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  sinon.assert.notCalled(loggerErrorStub) // nothing happens
  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore ignoring .env.example and .env.vault but .env.example and .env.vault file', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('.env*') // effectively ignores .env.example, .env.example
  sinon.stub(fs, 'readdirSync').returns(['.env.example', '.env.vault'])

  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  sinon.assert.notCalled(loggerErrorStub) // nothing happens
  ct.ok(loggerSuccessStub.calledWith('success (with warnings)'), 'logger.successvpb called')

  ct.end()
})

t.test('prebuild - .dockerignore ignoring somefile.txt it does not warn', (ct) => {
  sinon.stub(fs, 'existsSync').returns(true)
  sinon.stub(fs, 'readFileSync').returns('.env*\nsomefile.txt') // effectively ignores .env.example
  sinon.stub(fs, 'readdirSync').returns(['.env', 'somefile.txt'])

  const loggerErrorStub = sinon.stub(logger, 'errorvpb')
  const loggerWarnStub = sinon.stub(logger, 'warnv')
  const loggerHelpStub = sinon.stub(logger, 'help2')
  const loggerSuccessStub = sinon.stub(logger, 'successvpb')

  prebuild.call(fakeContext)

  sinon.assert.notCalled(loggerErrorStub) // nothing happens
  sinon.assert.notCalled(loggerWarnStub) // nothing happens
  sinon.assert.notCalled(loggerHelpStub) // nothing happens
  ct.ok(loggerSuccessStub.calledWith('success'), 'logger.successvpb called')

  ct.end()
})
