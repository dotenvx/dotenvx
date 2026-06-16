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
const armorMoveServicePath = require.resolve('../../../../src/lib/services/armorMove')
const moveActionPath = require.resolve('../../../../src/cli/actions/armor/move')

function loadMoveActionWithStubs ({ loggerExport, spinnerFactory, armorMoveServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalCreateSpinner = require(createSpinnerPath)
  const originalArmorMoveService = require(armorMoveServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[createSpinnerPath].exports = spinnerFactory
  require.cache[armorMoveServicePath].exports = armorMoveServiceExport
  delete require.cache[moveActionPath]
  require(moveActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[createSpinnerPath].exports = originalCreateSpinner
    require.cache[armorMoveServicePath].exports = originalArmorMoveService
    delete require.cache[moveActionPath]
  }
}

t.test('armor move uses session values and calls ArmorMove service with default env file', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const infoStub = sandbox.stub()
  const errorStub = sandbox.stub()
  const runStub = sandbox.stub().resolves({
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    team: 'hackclub',
    changed: true
  })
  const ArmorMoveStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile }
  })
  const restore = loadMoveActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorMoveServiceExport: ArmorMoveStub
  })
  const moveAction = require(moveActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await moveAction.call({ opts: () => ({}) })

  ct.same(ArmorMoveStub.firstCall && ArmorMoveStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', undefined], 'constructs ArmorMove with fallback session values')
  ct.equal(runStub.callCount, 1, 'runs ArmorMove once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['⛨ moved to hackclub (027 C9C)'], 'prints moved message')
  ct.equal(infoStub.callCount, 0, 'does not print no change info on success')
  ct.equal(errorStub.callCount, 0, 'does not log error on success')
  ct.equal(processExitStub.callCount, 0, 'does not exit process on success')
})

t.test('armor move passes explicit env file option to ArmorMove service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const runStub = sandbox.stub().resolves({
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    team: 'dotenvx',
    changed: true
  })
  const ArmorMoveStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile }
  })
  const restore = loadMoveActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorMoveServiceExport: ArmorMoveStub
  })
  const moveAction = require(moveActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await moveAction.call({ opts: () => ({ envFile: '.env.production' }) })

  ct.same(ArmorMoveStub.firstCall && ArmorMoveStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production'], 'passes --env-file value into ArmorMove')
  ct.equal(runStub.callCount, 1, 'runs ArmorMove request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
})

t.test('armor move prints no changes message when remote team is unchanged', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const infoStub = sandbox.stub()
  const ArmorMoveStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile) {
    this.args = { hostname, token, devicePublicKey, envFile }
    this.run = sandbox.stub().resolves({
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
      team: 'dotenvx',
      changed: false
    })
  })
  const restore = loadMoveActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorMoveServiceExport: ArmorMoveStub
  })
  const moveAction = require(moveActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await moveAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.equal(successStub.callCount, 0, 'does not print success for no change')
  ct.same(infoStub.lastCall && infoStub.lastCall.args, ['○ no change (027 C9C)'], 'prints no change message')
})

t.test('armor move logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const errorStub = sandbox.stub()
  const ArmorMoveStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(new Error('move failed'))
  })
  const restore = loadMoveActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorMoveServiceExport: ArmorMoveStub
  })
  const moveAction = require(moveActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await moveAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['move failed'], 'logs error message')
  ct.ok(processExitStub.calledWith(1), 'exits with code 1')
})
