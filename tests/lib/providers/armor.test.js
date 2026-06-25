const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('armor provider forwards approval instructions to onStatus', async ct => {
  const onStatus = sinon.stub()
  const runStub = sinon.stub().resolves({ private_key: 'private-key' })
  class SessionStub {
    hostname () {
      return 'https://armor.example.com'
    }

    token () {
      return 'token-1'
    }

    devicePublicKey () {
      return 'device-public-key'
    }
  }
  const instances = []
  class ArmorKeyringStub {
    constructor (hostname, token, devicePublicKey, publicKeyHex) {
      this.hostname = hostname
      this.token = token
      this.devicePublicKey = devicePublicKey
      this.publicKeyHex = publicKeyHex
      instances.push(this)
    }

    async run () {
      return runStub()
    }
  }
  const provider = proxyquire('../../../src/lib/providers/armor/index', {
    '../../../db/session': SessionStub,
    '../../services/armorKeyring': ArmorKeyringStub
  })

  const privateKey = await provider('027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71', { onStatus })
  instances[0].onApprovalRequired({
    approvalUri: 'https://armor.dotenvx.com/grants/grant-token-123',
    code: 'ACCESS_APPROVAL_REQUIRED'
  })

  ct.equal(privateKey, 'private-key')
  ct.equal(instances.length, 1)
  ct.same({
    hostname: instances[0].hostname,
    token: instances[0].token,
    devicePublicKey: instances[0].devicePublicKey,
    publicKeyHex: instances[0].publicKeyHex
  }, {
    hostname: 'https://armor.example.com',
    token: 'token-1',
    devicePublicKey: 'device-public-key',
    publicKeyHex: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71'
  })
  ct.same(onStatus.firstCall.args, ['[ACCESS_APPROVAL_REQUIRED] visit [https://armor.dotenvx.com/grants/grant-token-123] and approve (027 C9C)'])
  ct.end()
})
