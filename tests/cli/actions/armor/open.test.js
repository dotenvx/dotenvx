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
const openUrlPath = require.resolve('../../../../src/lib/helpers/openUrl')
const armorOpenServicePath = require.resolve('../../../../src/lib/services/armorOpen')
const openActionPath = require.resolve('../../../../src/cli/actions/armor/open')

function loadOpenActionWithStubs ({ loggerExport, openUrlExport, armorOpenServiceExport }) {
  const originalLoggerModule = require(loggerPath)
  const originalOpenUrl = require(openUrlPath)
  const originalArmorOpenService = require(armorOpenServicePath)

  require.cache[loggerPath].exports = loggerExport
  require.cache[openUrlPath].exports = openUrlExport
  require.cache[armorOpenServicePath].exports = armorOpenServiceExport
  delete require.cache[openActionPath]
  require(openActionPath)

  return () => {
    require.cache[loggerPath].exports = originalLoggerModule
    require.cache[openUrlPath].exports = originalOpenUrl
    require.cache[armorOpenServicePath].exports = originalArmorOpenService
    delete require.cache[openActionPath]
  }
}

t.test('armor open uses session hostname and opens default .env armored key', async (ct) => {
  const sandbox = sinon.createSandbox()
  const successStub = sandbox.stub()
  const openUrlStub = sandbox.stub().resolves()
  const runStub = sandbox.stub().returns({
    url: 'https://armor.dotenvx.com/go/arm_027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71',
    publicKeyValue: '027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71'
  })
  const ArmorOpenStub = sandbox.stub().callsFake(function (hostname, envFile) {
    this.run = runStub
    this.args = { hostname, envFile }
  })
  const restore = loadOpenActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        success: successStub,
        error: sandbox.stub()
      }
    },
    openUrlExport: openUrlStub,
    armorOpenServiceExport: ArmorOpenStub
  })
  const openAction = require(openActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  sandbox.stub(process, 'exit').callsFake(() => {})

  await openAction.call({ opts: () => ({}) })

  ct.same(ArmorOpenStub.firstCall && ArmorOpenStub.firstCall.args, ['https://armor.dotenvx.com', undefined], 'constructs ArmorOpen with session hostname')
  ct.equal(runStub.callCount, 1, 'runs ArmorOpen once')
  ct.same(openUrlStub.firstCall && openUrlStub.firstCall.args, ['https://armor.dotenvx.com/go/arm_027c9c5579cce25013e1e5ae8b4bde6d93bad14457babf5b3e055572ae4931f71'], 'opens go url in browser')
  ct.same(successStub.lastCall && successStub.lastCall.args, ['◌ opened (027 C9C)'], 'prints opened key display')
})

t.test('armor open passes explicit env file option to ArmorOpen service', async (ct) => {
  const sandbox = sinon.createSandbox()
  const openUrlStub = sandbox.stub().resolves()
  const runStub = sandbox.stub().returns({
    url: 'https://armor.dotenvx.com/go/arm_03aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    publicKeyValue: '03aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  })
  const ArmorOpenStub = sandbox.stub().callsFake(function (hostname, envFile) {
    this.run = runStub
    this.args = { hostname, envFile }
  })
  const restore = loadOpenActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        success: sandbox.stub(),
        error: sandbox.stub()
      }
    },
    openUrlExport: openUrlStub,
    armorOpenServiceExport: ArmorOpenStub
  })
  const openAction = require(openActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')

  await openAction.call({ opts: () => ({ envFile: '.env.production' }) })

  ct.same(ArmorOpenStub.firstCall && ArmorOpenStub.firstCall.args, ['https://armor.dotenvx.com', '.env.production'], 'passes --env-file value into ArmorOpen')
})

t.test('armor open logs errors and exits', async (ct) => {
  const sandbox = sinon.createSandbox()
  const errorStub = sandbox.stub()
  const openUrlStub = sandbox.stub().resolves()
  const ArmorOpenStub = sandbox.stub().callsFake(function () {
    this.run = sandbox.stub().throws(new Error('[MISSING_KEY] missing key (DOTENV_PUBLIC_KEY)'))
  })
  const restore = loadOpenActionWithStubs({
    loggerExport: {
      logger: {
        debug: sandbox.stub(),
        success: sandbox.stub(),
        error: errorStub
      }
    },
    openUrlExport: openUrlStub,
    armorOpenServiceExport: ArmorOpenStub
  })
  const openAction = require(openActionPath)

  ct.teardown(() => {
    restore()
    sandbox.restore()
  })

  sandbox.stub(Session.prototype, 'hostname').returns('https://armor.dotenvx.com')
  const processExitStub = sandbox.stub(process, 'exit').callsFake(() => {})

  await openAction.call({ opts: () => ({}) })

  ct.equal(openUrlStub.callCount, 0, 'does not open browser on error')
  ct.same(errorStub.lastCall && errorStub.lastCall.args, ['[MISSING_KEY] missing key (DOTENV_PUBLIC_KEY)'], 'logs error message')
  ct.equal(processExitStub.callCount, 1, 'exits process on error')
  ct.equal(processExitStub.firstCall.args[0], 1, 'exits with code 1')
})
