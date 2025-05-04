const t = require('tap')
const sinon = require('sinon')
const childProcess = require('child_process')

const scan = require('../../../../src/cli/actions/ext/scan')

const { logger } = require('../../../../src/shared/logger')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }
const originalExecSync = childProcess.execSync

t.beforeEach((ct) => {
  sinon.restore()
  childProcess.execSync = sinon.stub()
})

t.afterEach((ct) => {
  childProcess.execSync = originalExecSync // restore the original execSync after each test
})

t.test('scan - gitleaks not installed', (ct) => {
  childProcess.execSync.throws(new Error('gitleaks: command not found'))

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  scan.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('gitleaks: command not found'), 'logger.error logs')
  ct.ok(loggerHelpStub.calledWith('? install gitleaks:      [brew install gitleaks]'), 'logger.help logs')
  ct.ok(loggerHelpStub.calledWith('? other install options: [https://github.com/gitleaks/gitleaks]'), 'logger.help logs')

  ct.end()
})

t.test('scan - gitleaks installed and works', (ct) => {
  const gitleaksOutput = `
    ○
    │╲
    │ ○
    ○ ░
    ░    gitleaks

10:22AM INF 0 commits scanned.
10:22AM INF scan completed in 14.4ms
10:22AM INF no leaks found
  `

  childProcess.execSync.onCall(0).returns('8.18.4')
  childProcess.execSync.onCall(1).returns(gitleaksOutput)

  const loggerInfoStub = sinon.stub(logger, 'info')

  scan.call(fakeContext)

  ct.ok(loggerInfoStub.calledWith(gitleaksOutput), 'logger.info logs')

  ct.end()
})

t.test('scan - gitleaks installed and raises error', (ct) => {
  childProcess.execSync.onCall(0).returns('8.18.4')

  // Simulate gitleaks error with stderr output
  const error = new Error('Gitleaks failed')
  error.stdout = Buffer.from('leak: API_KEY=abcd1234')
  childProcess.execSync.onCall(1).throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')

  scan.call(fakeContext)

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerErrorStub.calledWith('leak: API_KEY=abcd1234'), 'logger.error logs')

  ct.end()
})
