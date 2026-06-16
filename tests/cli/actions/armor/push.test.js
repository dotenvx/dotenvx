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
const armorPushServicePath = require.resolve('../../../../src/lib/services/armorPush')
const pushActionPath = require.resolve('../../../../src/cli/actions/armor/push')

function loadPushActionWithStubs ({ loggerExport, spinnerFactory, armorPushServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalCreateSpinner = require(createSpinnerPath)
  const originalArmorPushService = require(armorPushServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[createSpinnerPath].exports = spinnerFactory
  require.cache[armorPushServicePath].exports = armorPushServiceExport
  delete require.cache[pushActionPath]
  require(pushActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[createSpinnerPath].exports = originalCreateSpinner
    require.cache[armorPushServicePath].exports = originalArmorPushService
    delete require.cache[pushActionPath]
  }
}

t.test('armor push passes explicit team option to ArmorPush service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const runStub = sandbox.stub().resolves({
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    changed: true
  })
  const ArmorPushStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadPushActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPushServiceExport: ArmorPushStub
  })
  const pushAction = require(pushActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pushAction.call({ opts: () => ({ envFile: '.env.production', team: 'hackclub' }) })

  ct.same(ArmorPushStub.firstCall && ArmorPushStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', 'hackclub'], 'passes --team value into ArmorPush')
  ct.equal(runStub.callCount, 1, 'runs ArmorPush request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['⛨ pushed (027 C9C)'], 'prints armored key display')
})

t.test('armor push prints no changes message when remote armor is unchanged', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const infoStub = sandbox.stub()
  const successStub = sandbox.stub()
  const ArmorPushStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().resolves({
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
      changed: false
    })
  })
  const restore = loadPushActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPushServiceExport: ArmorPushStub
  })
  const pushAction = require(pushActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pushAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.equal(successStub.callCount, 0, 'does not print success for no change')
  ct.same(infoStub.lastCall && infoStub.lastCall.args, ['○ no change (027 C9C)'], 'prints no change message')
})

t.test('armor push falls back to private key name when public key display is unavailable', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const ArmorPushStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().resolves({
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: null,
      changed: true
    })
  })
  const restore = loadPushActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPushServiceExport: ArmorPushStub
  })
  const pushAction = require(pushActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await pushAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['⛨ pushed (DOTENV_PRIVATE_KEY)'], 'prints private key name fallback')
})

t.test('armor push logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const errorStub = sandbox.stub()
  const ArmorPushStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(new Error('push failed'))
  })
  const restore = loadPushActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorPushServiceExport: ArmorPushStub
  })
  const pushAction = require(pushActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await pushAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['push failed'], 'logs error message')
  ct.ok(processExitStub.calledWith(1), 'exits with code 1')
})
