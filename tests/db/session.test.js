const fs = require('fs')
const os = require('os')
const path = require('path')
const t = require('tap')
const proxyquire = require('proxyquire')

t.beforeEach(() => {
  process.env.DOTENVX_CONFIG = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenvx-session-'))
})

t.afterEach(() => {
  delete process.env.DOTENVX_CONFIG
})

t.test('Session stores login settings in dotenvx config', async ct => {
  const Session = require('../../src/db/session')
  const sesh = new Session()

  ct.equal(sesh.hostname(), 'https://armor.dotenvx.com')
  ct.equal(sesh.username(), undefined)
  ct.equal(sesh.token(), undefined)
  ct.equal(sesh.on(), true)
  ct.equal(sesh.off(), false)
  ct.equal(sesh.login('https://armor.example.com', 'user-id', 'scott', 'token-123'), 'token-123')
  ct.equal(sesh.hostname(), 'https://armor.example.com')
  ct.equal(sesh.username(), 'scott')
  ct.equal(sesh.token(), 'token-123')
  ct.equal(sesh.status(), 'on')
  ct.equal(sesh.on(), true)
  ct.equal(sesh.off(), false)
  ct.type(sesh.path(), 'string')
  ct.match(fs.readFileSync(path.join(process.env.DOTENVX_CONFIG, '.env'), 'utf8'), /DOTENVX_ARMOR_TOKEN="token-123"/)
  await ct.resolves(sesh.notifyUpdate())
})

t.test('Session validates login settings before saving', ct => {
  const Session = require('../../src/db/session')
  const sesh = new Session()

  ct.throws(() => sesh.login(), /DOTENVX_ARMOR_HOSTNAME/)
  ct.throws(() => sesh.login('https://armor.example.com'), /DOTENVX_ARMOR_USER/)
  ct.throws(() => sesh.login('https://armor.example.com', 'user-id'), /DOTENVX_ARMOR_USERNAME/)
  ct.throws(() => sesh.login('https://armor.example.com', 'user-id', 'scott'), /DOTENVX_ARMOR_TOKEN/)
  ct.end()
})

t.test('Session logout clears login settings when config exists', ct => {
  const Session = require('../../src/db/session')
  const sesh = new Session()

  sesh.login('https://armor.example.com', 'user-id', 'scott', 'token-123')
  ct.equal(sesh.status(), 'on')
  ct.equal(sesh.logout('https://armor.example.com', 'user-id', 'token-123'), true)
  ct.equal(sesh.username(), undefined)
  ct.equal(sesh.token(), undefined)
  ct.equal(sesh.hostname(), 'https://armor.dotenvx.com')
  ct.equal(sesh.status(), 'off')
  ct.end()
})

t.test('Session validates logout settings before clearing', ct => {
  const Session = require('../../src/db/session')
  const sesh = new Session()

  ct.throws(() => sesh.logout(), /DOTENVX_ARMOR_HOSTNAME/)
  ct.throws(() => sesh.logout('https://armor.example.com'), /DOTENVX_ARMOR_USER/)
  ct.throws(() => sesh.logout('https://armor.example.com', 'user-id'), /DOTENVX_ARMOR_TOKEN/)
  ct.end()
})

t.test('Session logout does not create config when config is absent', ct => {
  const configPath = path.join(process.env.DOTENVX_CONFIG, '.env')
  class FakeConf {
    constructor () {
      throw new Error('Conf should not be constructed')
    }
  }

  const Session = proxyquire('../../src/db/session', {
    conf: FakeConf
  })
  const sesh = new Session()

  ct.equal(sesh.logout('https://armor.example.com', 'user-id', 'token-123'), true)
  ct.notOk(fs.existsSync(configPath), 'config file is not created')
  ct.end()
})

t.test('Session does not open config for status helpers when config is absent', async ct => {
  const configPath = path.join(process.env.DOTENVX_CONFIG, '.env')
  class FakeConf {
    constructor () {
      throw new Error('Conf should not be constructed')
    }
  }

  class ArmorMock {
    async status () {
      return 'off'
    }

    statusSync () {
      return 'off'
    }
  }

  const Session = proxyquire('../../src/db/session', {
    conf: FakeConf,
    './../lib/extensions/armor': ArmorMock
  })
  const sesh = new Session()

  ct.equal(sesh.status(), 'off')
  ct.equal(sesh.hostname(), 'https://armor.dotenvx.com')
  ct.equal(sesh.username(), undefined)
  ct.equal(sesh.token(), undefined)
  ct.equal(sesh.on(), true)
  ct.equal(sesh.off(), false)
  ct.equal(sesh.store, null)
  ct.equal(sesh.path(), configPath)
  ct.equal(sesh.noArmorSync(), true)
  ct.equal(await sesh.noArmor(), true)
  ct.notOk(fs.existsSync(configPath), 'config file is not created')
})

t.test('Session supports default config path when DOTENVX_CONFIG is unset', ct => {
  delete process.env.DOTENVX_CONFIG
  const Session = proxyquire('../../src/db/session', {
    'env-paths': () => ({ config: '/tmp/default-dotenvx-config' })
  })
  const sesh = new Session()

  ct.equal(sesh.path(), '/tmp/default-dotenvx-config/.env')
  ct.equal(sesh.hostname(), 'https://armor.dotenvx.com')
  ct.end()
})

t.test('Session creates default store on login when DOTENVX_CONFIG is unset', ct => {
  delete process.env.DOTENVX_CONFIG
  let confOptions
  class FakeConf {
    constructor (options) {
      confOptions = options
      this.path = 'default-path'
      this.values = {}
    }

    get (key) {
      return this.values[key]
    }

    set (key, value) {
      this.values[key] = value
    }
  }

  const Session = proxyquire('../../src/db/session', {
    conf: FakeConf
  })
  const sesh = new Session()

  ct.equal(sesh.login('https://armor.example.com', 'user-id', 'scott', 'token-123'), 'token-123')
  ct.equal(confOptions.cwd, undefined)
  ct.equal(sesh.path(), 'default-path')
  ct.end()
})

t.test('Session reads existing config without login', ct => {
  const configPath = path.join(process.env.DOTENVX_CONFIG, '.env')
  fs.writeFileSync(configPath, 'DOTENVX_ARMOR_HOSTNAME="https://armor.example.com"\nDOTENVX_ARMOR_USERNAME="scott"\nDOTENVX_ARMOR_TOKEN="token-123"\n', 'utf8')

  const Session = require('../../src/db/session')
  const sesh = new Session()

  ct.equal(sesh.hostname(), 'https://armor.example.com')
  ct.equal(sesh.username(), 'scott')
  ct.equal(sesh.token(), 'token-123')
  ct.equal(sesh.status(), 'on')
  ct.end()
})

t.test('Session returns device public key and system information', async ct => {
  const Session = require('../../src/db/session')
  const sesh = new Session()

  ct.match(sesh.devicePublicKey(), /^[0-9a-f]+$/)
  const info = await sesh.systemInformation()
  ct.type(info.system_uuid, 'string')
  ct.type(info.os_platform, 'string')
  ct.type(info.os_arch, 'string')
})

t.test('Device reuses existing private key', ct => {
  const Device = require('../../src/db/device')
  const device = new Device()

  const firstPrivateKey = device.privateKey()
  const secondPrivateKey = device.privateKey()

  ct.equal(secondPrivateKey, firstPrivateKey)
  ct.same(device.touch(), {
    privateKey: firstPrivateKey,
    publicKey: device.publicKey()
  })
  const encrypted = device.encrypt('hello')
  ct.equal(device.decrypt(encrypted), 'hello')
  ct.type(device.configPath(), 'string')
  ct.end()
})

t.test('Device supports default config path and empty private key branch', ct => {
  delete process.env.DOTENVX_CONFIG
  let confOptions
  class FakeConf {
    constructor (options) {
      confOptions = options
    }

    get () {
      return null
    }

    set () {}
  }

  const Device = proxyquire('../../src/db/device', {
    conf: FakeConf,
    '../lib/helpers/cryptography/localKeypair': () => ({
      publicKey: 'public-key',
      privateKey: 'private-key'
    })
  })
  const device = new Device()

  ct.equal(confOptions.cwd, undefined)
  device.privateKey = () => ''
  ct.equal(device.publicKey(), '')
  ct.end()
})
