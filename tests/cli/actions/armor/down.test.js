const t = require('tap')
const sinon = require('sinon')

const Session = require('../../../../src/db/session')

const loggerPath = require.resolve('../../../../src/shared/logger')
const createSpinnerPath = require.resolve('../../../../src/lib/helpers/createSpinner')
const armorDownServicePath = require.resolve('../../../../src/lib/services/armorDown')
const downActionPath = require.resolve('../../../../src/cli/actions/armor/down')

function loadDownActionWithStubs ({ loggerExport, spinnerFactory, armorDownServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalCreateSpinner = require(createSpinnerPath)
  const originalArmorDownService = require(armorDownServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[createSpinnerPath].exports = spinnerFactory
  require.cache[armorDownServicePath].exports = armorDownServiceExport
  delete require.cache[downActionPath]
  require(downActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[createSpinnerPath].exports = originalCreateSpinner
    require.cache[armorDownServicePath].exports = originalArmorDownService
    delete require.cache[downActionPath]
  }
}

t.test('armor down uses session values and calls ArmorDown service with default env file', async (ct) => {
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
  const ArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadDownActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorDownServiceExport: ArmorDownStub
  })
  const downAction = require(downActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'notifyUpdate').resolves()
  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await downAction.call({ opts: () => ({}) })

  ct.same(ArmorDownStub.firstCall && ArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', undefined, undefined], 'constructs ArmorDown with fallback session values')
  ct.equal(runStub.callCount, 1, 'runs ArmorDown once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['◇ dearmored to .env.keys (027 C9C)'], 'prints dearmored message')
  ct.equal(infoStub.callCount, 0, 'does not print no change info on success')
  ct.equal(errorStub.callCount, 0, 'does not log error on success')
  ct.equal(processExitStub.callCount, 0, 'does not exit process on success')
})

t.test('armor down passes explicit env file option to ArmorDown service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const runStub = sandbox.stub().resolves({
    public_key: 'pub',
    private_key: 'priv',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    changed: true
  })
  const ArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadDownActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorDownServiceExport: ArmorDownStub
  })
  const downAction = require(downActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'notifyUpdate').resolves()
  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await downAction.call({ opts: () => ({ envFile: '.env.production' }) })

  ct.same(ArmorDownStub.firstCall && ArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', undefined], 'passes --env-file value into ArmorDown')
  ct.equal(runStub.callCount, 1, 'runs ArmorDown request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
})

t.test('armor down passes explicit team option to ArmorDown service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const runStub = sandbox.stub().resolves({
    public_key: 'pub',
    private_key: 'priv',
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    changed: true
  })
  const ArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadDownActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorDownServiceExport: ArmorDownStub
  })
  const downAction = require(downActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'notifyUpdate').resolves()
  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await downAction.call({ opts: () => ({ envFile: '.env.production', team: 'hackclub' }) })

  ct.same(ArmorDownStub.firstCall && ArmorDownStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', 'hackclub'], 'passes --team value into ArmorDown')
  ct.equal(runStub.callCount, 1, 'runs ArmorDown request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
})

t.test('armor down prints no changes message when remote armor is unchanged', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const infoStub = sandbox.stub()
  const ArmorDownStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.args = { hostname, token, devicePublicKey, envFile, team }
    this.run = sandbox.stub().resolves({
      public_key: 'pub',
      private_key: 'priv',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
      changed: false
    })
  })
  const restore = loadDownActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorDownServiceExport: ArmorDownStub
  })
  const downAction = require(downActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'notifyUpdate').resolves()
  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await downAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.equal(successStub.callCount, 0, 'does not print success for no change')
  ct.same(infoStub.lastCall && infoStub.lastCall.args, ['○ no change (027 C9C)'], 'prints no change message')
})

t.test('armor down logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const errorStub = sandbox.stub()
  const ArmorDownStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(new Error('down failed'))
  })
  const restore = loadDownActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorDownServiceExport: ArmorDownStub
  })
  const downAction = require(downActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'notifyUpdate').resolves()
  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await downAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['down failed'], 'logs error message')
  ct.ok(processExitStub.calledWith(1), 'exits with code 1')
})
