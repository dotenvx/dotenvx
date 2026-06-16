const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
})

t.test('Login requests device code with device public key and system info', async ct => {
  const session = {
    devicePublicKey: sinon.stub().returns('device-pub'),
    systemInformation: sinon.stub().resolves({ system_uuid: 'uuid' })
  }
  const PostOauthDeviceCode = sinon.stub().callsFake(function (hostname, devicePublicKey, systemInformation) {
    this.run = sinon.stub().resolves({
      device_code: 'device-code',
      user_code: 'user-code',
      verification_uri: 'https://armor.example.com/device',
      verification_uri_complete: 'https://armor.example.com/device?code=user-code',
      interval: 3
    })
  })
  const Login = proxyquire('../../../src/lib/services/login', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postOauthDeviceCode': PostOauthDeviceCode
  })

  const out = await new Login('https://armor.example.com').run()

  ct.same(PostOauthDeviceCode.firstCall.args, ['https://armor.example.com', 'device-pub', { system_uuid: 'uuid' }])
  ct.same(out, {
    deviceCode: 'device-code',
    userCode: 'user-code',
    verificationUri: 'https://armor.example.com/device',
    verificationUriComplete: 'https://armor.example.com/device?code=user-code',
    interval: 3
  })
})

t.test('LoginPoll saves token when access token is returned', async ct => {
  const session = {
    login: sinon.stub(),
    notifyUpdate: sinon.stub().resolves()
  }
  const PostOauthToken = sinon.stub().callsFake(function () {
    this.run = sinon.stub().resolves({
      access_token: 'token-123',
      id: 'user-id',
      username: 'scott'
    })
  })
  const LoginPoll = proxyquire('../../../src/lib/services/loginPoll', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postOauthToken': PostOauthToken
  })

  const out = await new LoginPoll('https://armor.example.com', 'device-code', 0).run()

  ct.equal(out.access_token, 'token-123')
  ct.same(session.login.firstCall.args, ['https://armor.example.com', 'user-id', 'scott', 'token-123'])
  ct.equal(session.notifyUpdate.callCount, 1)
})

t.test('LoginPoll continues on authorization_pending', async ct => {
  const session = {
    login: sinon.stub(),
    notifyUpdate: sinon.stub().resolves()
  }
  const pending = new Error('[authorization_pending] still waiting')
  pending.code = 'authorization_pending'
  const run = sinon.stub()
    .onCall(0).rejects(pending)
    .onCall(1).resolves({
      access_token: 'token-123',
      id: 'user-id',
      username: 'scott'
    })
  const PostOauthToken = sinon.stub().callsFake(function () {
    this.run = run
  })
  const LoginPoll = proxyquire('../../../src/lib/services/loginPoll', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postOauthToken': PostOauthToken
  })

  const out = await new LoginPoll('https://armor.example.com', 'device-code', 0).run()

  ct.equal(out.access_token, 'token-123')
  ct.equal(run.callCount, 2)
  ct.equal(session.notifyUpdate.callCount, 1)
})

t.test('LoginPoll waits when token response has no access token yet', async ct => {
  const session = {
    login: sinon.stub(),
    notifyUpdate: sinon.stub().resolves()
  }
  const run = sinon.stub()
    .onCall(0).resolves({})
    .onCall(1).resolves({
      access_token: 'token-123',
      id: 'user-id',
      username: 'scott'
    })
  const PostOauthToken = sinon.stub().callsFake(function () {
    this.run = run
  })
  const LoginPoll = proxyquire('../../../src/lib/services/loginPoll', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postOauthToken': PostOauthToken
  })

  const out = await new LoginPoll('https://armor.example.com', 'device-code', 0).run()

  ct.equal(out.access_token, 'token-123')
  ct.equal(run.callCount, 2)
  ct.equal(session.notifyUpdate.callCount, 1)
})

t.test('LoginPoll throws non-pending errors', async ct => {
  const boom = new Error('boom')
  boom.code = 'server_error'
  const PostOauthToken = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(boom)
  })
  const LoginPoll = proxyquire('../../../src/lib/services/loginPoll', {
    '../../db/session': sinon.stub().returns({}),
    '../api/postOauthToken': PostOauthToken
  })

  await ct.rejects(new LoginPoll('https://armor.example.com', 'device-code', 0).run(), boom)
})
