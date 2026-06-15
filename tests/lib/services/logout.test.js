const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  sinon.restore()
})

t.test('Logout posts logout and clears local session', async ct => {
  const session = {
    token: sinon.stub().returns('token-123'),
    logout: sinon.stub().returns(true)
  }
  const PostLogout = sinon.stub().callsFake(function (hostname, token) {
    this.run = sinon.stub().resolves({
      id: 'user-id',
      username: 'scott',
      access_token: 'token-123'
    })
  })
  const Logout = proxyquire('../../../src/lib/services/logout', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postLogout': PostLogout
  })

  const out = await new Logout('https://armor.example.com').run()

  ct.same(PostLogout.firstCall.args, ['https://armor.example.com', 'token-123'])
  ct.same(session.logout.firstCall.args, ['https://armor.example.com', 'user-id', 'token-123'])
  ct.same(out, {
    username: 'scott',
    accessToken: 'token-123',
    settingsDevicesUrl: 'https://armor.example.com/settings/devices'
  })
})

t.test('Logout does not clear local session when api logout fails', async ct => {
  const expected = new Error('logout failed')
  const session = {
    token: sinon.stub().returns('token-123'),
    logout: sinon.stub()
  }
  const PostLogout = sinon.stub().callsFake(function () {
    this.run = sinon.stub().rejects(expected)
  })
  const Logout = proxyquire('../../../src/lib/services/logout', {
    '../../db/session': sinon.stub().returns(session),
    '../api/postLogout': PostLogout
  })

  await ct.rejects(new Logout('https://armor.example.com').run(), expected)
  ct.equal(session.logout.callCount, 0)
})
