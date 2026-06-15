const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { logger } = require('../../../src/shared/logger')

t.beforeEach(() => {
  sinon.restore()
})

t.test('logout action runs native logout service', async ct => {
  const spinner = { stop: sinon.stub() }
  const loggerSuccessStub = sinon.stub(logger, 'success')
  sinon.stub(logger, 'debug')
  const session = {
    hostname: sinon.stub().returns('https://saved.example.com')
  }
  const Logout = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({ username: 'scott' })
  })
  const logout = proxyquire('../../../src/cli/actions/logout', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/services/logout': Logout,
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner)
  })

  await logout.call({ opts: () => ({ hostname: 'https://armor.example.com' }) })

  ct.same(Logout.firstCall.args, ['https://armor.example.com'])
  ct.ok(loggerSuccessStub.calledWith('◌ logged out (scott)'))
  ct.equal(spinner.stop.callCount, 1)
})

t.test('logout action falls back to saved hostname and reports errors', async ct => {
  const spinner = { stop: sinon.stub() }
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(logger, 'debug')
  const session = {
    hostname: sinon.stub().returns('https://saved.example.com')
  }
  const Logout = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(new Error('logout failed'))
  })
  const logout = proxyquire('../../../src/cli/actions/logout', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/services/logout': Logout,
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner)
  })

  await logout.call({ opts: () => ({}) })

  ct.same(Logout.firstCall.args, ['https://saved.example.com'])
  ct.ok(loggerErrorStub.calledWith('logout failed'))
  ct.equal(spinner.stop.callCount, 1)
  ct.ok(processExitStub.calledWith(1))
})

t.test('logout action reports non-error rejection values', async ct => {
  const spinner = { stop: sinon.stub() }
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(logger, 'debug')
  const failure = { code: 'logout_failed' }
  const Logout = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(failure)
  })
  const logout = proxyquire('../../../src/cli/actions/logout', {
    '../../db/session': sinon.stub().returns({ hostname: sinon.stub().returns('https://saved.example.com') }),
    '../../lib/services/logout': Logout,
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner)
  })

  await logout.call({ opts: () => ({}) })

  ct.same(loggerErrorStub.firstCall.args, [failure])
  ct.ok(processExitStub.calledWith(1))
})
