const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { logger } = require('../../../src/shared/logger')

t.beforeEach(() => {
  sinon.restore()
})

t.test('login action runs native oauth device flow', async ct => {
  const spinner = { stop: sinon.stub() }
  const cleanup = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  sinon.stub(logger, 'debug')
  const session = {
    hostname: sinon.stub().returns('https://armor.dotenvx.com')
  }
  const Login = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({
      deviceCode: 'device-code',
      userCode: 'ABCD1234',
      verificationUri: 'https://armor.example.com/device',
      verificationUriComplete: 'https://armor.example.com/device?code=ABCD1234',
      interval: 3
    })
  })
  const LoginPoll = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({ username: 'scott' })
  })
  const login = proxyquire('../../../src/cli/actions/login', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/services/login': Login,
    '../../lib/services/loginPoll': LoginPoll,
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner),
    '../../lib/helpers/listenForOpenKey': sinon.stub().returns(cleanup),
    '../../lib/helpers/openUrl': sinon.stub()
  })

  await login.call({ opts: () => ({ hostname: 'https://armor.example.com' }) })

  ct.same(Login.firstCall.args, ['https://armor.example.com'])
  ct.same(LoginPoll.firstCall.args, ['https://armor.example.com', 'device-code', 3])
  ct.ok(loggerInfoStub.calledWith('◌ press Enter to open [https://armor.example.com/device] and enter code [ABCD-1234]...'))
  ct.ok(loggerSuccessStub.calledWith('◉ logged in (scott)'))
  ct.equal(cleanup.callCount, 1)
  ct.equal(spinner.stop.callCount, 1)
  ct.ok(processExitStub.calledWith(0))
})

t.test('login action falls back to saved hostname and reports errors', async ct => {
  const spinner = { stop: sinon.stub() }
  const cleanup = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(logger, 'debug')
  const session = {
    hostname: sinon.stub().returns('https://saved.example.com')
  }
  const Login = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(new Error('login failed'))
  })
  const login = proxyquire('../../../src/cli/actions/login', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/services/login': Login,
    '../../lib/services/loginPoll': sinon.stub(),
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner),
    '../../lib/helpers/listenForOpenKey': sinon.stub().returns(cleanup),
    '../../lib/helpers/openUrl': sinon.stub()
  })

  await login.call({ opts: () => ({}) })

  ct.same(Login.firstCall.args, ['https://saved.example.com'])
  ct.ok(loggerErrorStub.calledWith('login failed'))
  ct.equal(spinner.stop.callCount, 1)
  ct.ok(processExitStub.calledWith(1))
})

t.test('login action reports non-error rejection values', async ct => {
  const spinner = { stop: sinon.stub() }
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(logger, 'debug')
  const failure = { code: 'login_failed' }
  const session = {
    hostname: sinon.stub().returns('https://saved.example.com')
  }
  const Login = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(failure)
  })
  const login = proxyquire('../../../src/cli/actions/login', {
    '../../db/session': sinon.stub().returns(session),
    '../../lib/services/login': Login,
    '../../lib/services/loginPoll': sinon.stub(),
    '../../lib/helpers/createSpinner': sinon.stub().resolves(spinner),
    '../../lib/helpers/listenForOpenKey': sinon.stub().returns(sinon.stub()),
    '../../lib/helpers/openUrl': sinon.stub()
  })

  await login.call({ opts: () => ({}) })

  ct.same(loggerErrorStub.firstCall.args, [failure])
  ct.ok(processExitStub.calledWith(1))
})
