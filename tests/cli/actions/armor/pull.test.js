const t = require('tap')
const sinon = require('sinon')

const Session = require('../../../../src/db/session')

t.beforeEach(() => {
  sinon.stub(Session.prototype, 'notifyUpdate').resolves()
})

t.afterEach(() => {
  sinon.restore()
})

const loggerPath = require.resolve('../../../../src/shared/logger')
const createSpinnerPath = require.resolve('../../../../src/lib/helpers/createSpinner')
const armorPullServicePath = require.resolve('../../../../src/lib/services/armorPull')
const pullActionPath = require.resolve('../../../../src/cli/actions/armor/pull')

function loadPullActionWithStubs ({ loggerExport, spinnerFactory, armorPullServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalCreateSpinner = require(createSpinnerPath)
  const originalArmorPullService = require(armorPullServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[createSpinnerPath].exports = spinnerFactory
  require.cache[armorPullServicePath].exports = armorPullServiceExport
  delete require.cache[pullActionPath]
  require(pullActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[createSpinnerPath].exports = originalCreateSpinner
    require.cache[armorPullServicePath].exports = originalArmorPullService
    delete require.cache[pullActionPath]
  }
}

t.test('armor pull uses session values and calls ArmorPull service with default env file', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const infoStub = sandbox.stub()
  const errorStub = sandbox.stub()
  const runStub = sandbox.stub().resolves({
    public_key: 'pub',
    private_key: 'priv',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    changed: true
  })
  const ArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadPullActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPullServiceExport: ArmorPullStub
  })
  const pullAction = require(pullActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await pullAction.call({ opts: () => ({}) })

  ct.same(ArmorPullStub.firstCall && ArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', undefined, undefined], 'constructs ArmorPull with fallback session values')
  ct.equal(runStub.callCount, 1, 'runs ArmorPull once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['◇ pulled to .env.keys (027 C9C)'], 'prints pulled message')
  ct.equal(infoStub.callCount, 0, 'does not print no change info on success')
  ct.equal(errorStub.callCount, 0, 'does not log error on success')
  ct.equal(processExitStub.callCount, 0, 'does not exit process on success')
})

t.test('armor pull passes explicit env file option to ArmorPull service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const runStub = sandbox.stub().resolves({
    public_key: 'pub',
    private_key: 'priv',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    changed: true
  })
  const ArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadPullActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPullServiceExport: ArmorPullStub
  })
  const pullAction = require(pullActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pullAction.call({ opts: () => ({ envFile: '.env.production' }) })

  ct.same(ArmorPullStub.firstCall && ArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', undefined], 'passes --env-file value into ArmorPull')
  ct.equal(runStub.callCount, 1, 'runs ArmorPull request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
})

t.test('armor pull passes explicit team option to ArmorPull service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const runStub = sandbox.stub().resolves({
    public_key: 'pub',
    private_key: 'priv',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    changed: true
  })
  const ArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadPullActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPullServiceExport: ArmorPullStub
  })
  const pullAction = require(pullActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pullAction.call({ opts: () => ({ envFile: '.env.production', team: 'hackclub' }) })

  ct.same(ArmorPullStub.firstCall && ArmorPullStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', 'hackclub'], 'passes --team value into ArmorPull')
  ct.equal(runStub.callCount, 1, 'runs ArmorPull request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
})

t.test('armor pull prints no changes message when .env.keys is unchanged', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const infoStub = sandbox.stub()
  const ArmorPullStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.args = { hostname, token, devicePublicKey, envFile, team }
    this.run = sandbox.stub().resolves({
      public_key: 'pub',
      private_key: 'priv',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
      changed: false
    })
  })
  const restore = loadPullActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPullServiceExport: ArmorPullStub
  })
  const pullAction = require(pullActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pullAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.equal(successStub.callCount, 0, 'does not print success for no change')
  ct.same(infoStub.lastCall && infoStub.lastCall.args, ['○ no change (027 C9C)'], 'prints no change message')
})

t.test('armor pull logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const errorStub = sandbox.stub()
  const ArmorPullStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(new Error('pull failed'))
  })
  const restore = loadPullActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPullServiceExport: ArmorPullStub
  })
  const pullAction = require(pullActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await pullAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['pull failed'], 'logs error message')
  ct.ok(processExitStub.calledWith(1), 'exits with code 1')
})
