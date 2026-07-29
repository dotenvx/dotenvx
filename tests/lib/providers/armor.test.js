const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

t.test('armor provider forwards approval instructions to onStatus and opens url on Enter', async ct => {
  const onStatus = sinon.stub()
  const openUrl = sinon.stub().resolves()
  const cleanup = sinon.stub()
  const listenForOpenKey = sinon.stub().returns(cleanup)
  const instances = []
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
  class ArmorKeyringStub {
    constructor (hostname, token, devicePublicKey, publicKeyHex) {
      this.hostname = hostname
      this.token = token
      this.devicePublicKey = devicePublicKey
      this.publicKeyHex = publicKeyHex
      instances.push(this)
    }

    async run () {
      this.onApprovalRequired({
        approvalUri: 'https://armor.dotenvx.com/grants/grant-token-123',
        code: 'ACCESS_APPROVAL_REQUIRED'
      })
      return { 'public-key': 'private-key' }
    }
  }
  const provider = proxyquire('../../../src/lib/providers/armor/index', {
    '../../../db/session': SessionStub,
    '../../services/armorKeyring': ArmorKeyringStub,
    '../../helpers/listenForOpenKey': listenForOpenKey,
    '../../helpers/openUrl': openUrl
  })

  const ring = await provider('027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71', { onStatus })

  ct.same(ring, { 'public-key': 'private-key' })
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
  ct.same(onStatus.firstCall.args, ['[ACCESS_APPROVAL_REQUIRED] press Enter to open [https://armor.dotenvx.com/grants/grant-token-123] and approve (027 C9C)'])
  ct.ok(listenForOpenKey.calledOnce, 'listens for Enter')
  await listenForOpenKey.firstCall.args[0]()
  ct.ok(openUrl.calledWith('https://armor.dotenvx.com/grants/grant-token-123'), 'opens approval uri')
  ct.ok(cleanup.calledOnce, 'cleans up open-key listener')
  ct.end()
})

t.test('armor provider returns an empty keyring when armor has no matching keys', async ct => {
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
  class ArmorKeyringStub {
    async run () {
      return {}
    }
  }
  const provider = proxyquire('../../../src/lib/providers/armor/index', {
    '../../../db/session': SessionStub,
    '../../services/armorKeyring': ArmorKeyringStub
  })

  const ring = await provider('027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71')

  ct.same(ring, {})
  ct.end()
})

t.test('armor provider returns an empty keyring when Armor is offline', async ct => {
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
  class ArmorKeyringStub {
    async run () {
      const error = new Error('getaddrinfo ENOTFOUND armor.example.com')
      error.code = 'ENOTFOUND'
      throw error
    }
  }
  const provider = proxyquire('../../../src/lib/providers/armor/index', {
    '../../../db/session': SessionStub,
    '../../services/armorKeyring': ArmorKeyringStub
  })

  const ring = await provider('public-key')

  ct.same(ring, {})
  ct.end()
})

t.test('armor provider preserves Armor API errors', async ct => {
  const expectedError = new Error('[SERVER_SIDE_DECRYPTION_REQUIRED] server-side decryption required')
  expectedError.code = 'SERVER_SIDE_DECRYPTION_REQUIRED'

  class SessionStub {
    hostname () {}
    token () {}
    devicePublicKey () {}
  }
  class ArmorKeyringStub {
    async run () {
      throw expectedError
    }
  }
  const provider = proxyquire('../../../src/lib/providers/armor/index', {
    '../../../db/session': SessionStub,
    '../../services/armorKeyring': ArmorKeyringStub
  })

  await ct.rejects(provider('public-key'), expectedError)
  ct.end()
})
