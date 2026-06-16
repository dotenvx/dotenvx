const t = require('tap')
const sinon = require('sinon')

const Session = require('../../../../src/db/session')

const loggerPath = require.resolve('../../../../src/shared/logger')
const createSpinnerPath = require.resolve('../../../../src/lib/helpers/createSpinner')
const armorUpServicePath = require.resolve('../../../../src/lib/services/armorUp')
const upActionPath = require.resolve('../../../../src/cli/actions/armor/up')

function loadUpActionWithStubs ({ loggerExport, spinnerFactory, armorUpServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalCreateSpinner = require(createSpinnerPath)
  const originalArmorUpService = require(armorUpServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[createSpinnerPath].exports = spinnerFactory
  require.cache[armorUpServicePath].exports = armorUpServiceExport
  delete require.cache[upActionPath]
  require(upActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[createSpinnerPath].exports = originalCreateSpinner
    require.cache[armorUpServicePath].exports = originalArmorUpService
    delete require.cache[upActionPath]
  }
}

t.test('armor up passes explicit team option to ArmorUp service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const runStub = sandbox.stub().resolves({
    privateKeyName: 'DOTENV_PRIVATE_KEY_PRODUCTION',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    changed: true
  })
  const ArmorUpStub = sandbox.stub().callsFake(function (hostname, token, devicePublicKey, envFile, team) {
    this.run = runStub
    this.args = { hostname, token, devicePublicKey, envFile, team }
  })
  const restore = loadUpActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorUpServiceExport: ArmorUpStub
  })
  const upAction = require(upActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await upAction.call({ opts: () => ({ envFile: '.env.production', team: 'hackclub' }) })

  ct.same(ArmorUpStub.firstCall && ArmorUpStub.firstCall.args, ['https://armor.dotenvx.com', 'session-token', 'device-public-key', '.env.production', 'hackclub'], 'passes --team value into ArmorUp')
  ct.equal(runStub.callCount, 1, 'runs ArmorUp request once')
  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['⛨ armored (027 C9C)'], 'prints armored key display')
})

t.test('armor up prints no changes message when remote armor is unchanged', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const infoStub = sandbox.stub()
  const successStub = sandbox.stub()
  const ArmorUpStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().resolves({
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
      changed: false
    })
  })
  const restore = loadUpActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: infoStub,
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorUpServiceExport: ArmorUpStub
  })
  const upAction = require(upActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await upAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.equal(successStub.callCount, 0, 'does not print success for no change')
  ct.same(infoStub.lastCall && infoStub.lastCall.args, ['○ no change (027 C9C)'], 'prints no change message')
})

t.test('armor up falls back to private key name when public key display is unavailable', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const successStub = sandbox.stub()
  const ArmorUpStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().resolves({
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      publicKeyValue: null,
      changed: true
    })
  })
  const restore = loadUpActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: successStub,
        error: sandbox.stub()
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorUpServiceExport: ArmorUpStub
  })
  const upAction = require(upActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await upAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after success')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['⛨ armored (DOTENV_PRIVATE_KEY)'], 'prints private key name fallback')
})

t.test('armor up logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const spinnerStop = sandbox.spy()
  const errorStub = sandbox.stub()
  const ArmorUpStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().rejects(new Error('up failed'))
  })
  const restore = loadUpActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        info: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    spinnerFactory: async () => ({ stop: spinnerStop }),
    armorUpServiceExport: ArmorUpStub
  })
  const upAction = require(upActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(Session.prototype, 'token').returns('session-token')
  sandbox.stub(Session.prototype, 'devicePublicKey').returns('device-public-key')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await upAction.call({ opts: () => ({}) })

  ct.equal(spinnerStop.callCount, 1, 'stops spinner after error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['up failed'], 'logs error message')
  ct.ok(processExitStub.calledWith(1), 'exits with code 1')
})
