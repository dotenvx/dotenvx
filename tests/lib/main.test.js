const t = require('tap')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../src/lib/main')

const Ls = require('../../src/lib/services/ls')
const Get = require('../../src/lib/services/get')
const Run = require('../../src/lib/services/run')
const Keypair = require('../../src/lib/services/keypair')
const Genexample = require('../../src/lib/services/genexample')

const { logger } = require('../../src/shared/logger')

t.test('config calls Run.run', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('config with convention - calls Run.run with proper envs', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config({ convention: 'nextjs' })

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('config with Run.run error', ct => {
  const loggerWarnStub = sinon.stub(logger, 'warnv')
  const error = new Error('some error')
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{ error }], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerWarnStub.calledWith('some error'), 'warn')

  stub.restore()
  loggerWarnStub.restore()

  ct.end()
})

t.test('configDotenv calls dotenv.configDotenv', ct => {
  const stub = sinon.stub(dotenv, 'configDotenv')
  stub.returns({})

  main.configDotenv()

  t.ok(stub.called, 'dotenv.configDotenv() called')

  stub.restore()

  ct.end()
})

t.test('parse calls dotenv.parse', ct => {
  const stub = sinon.stub(dotenv, 'parse')
  stub.returns({})

  main.parse()

  t.ok(stub.called, 'dotenv.parse() called')

  stub.restore()

  ct.end()
})

t.test('ls calls Ls.run', ct => {
  const stub = sinon.stub(Ls.prototype, 'run')
  stub.returns({})

  main.ls()

  t.ok(stub.called, 'new Ls().run() called')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({})

  main.get()

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('keypair calls Keypair.run', ct => {
  const stub = sinon.stub(Keypair.prototype, 'run')
  stub.returns({})

  main.keypair()

  t.ok(stub.called, 'new Keypair().run() called')

  stub.restore()

  ct.end()
})

t.test('genexample calls Genexample.run', ct => {
  const stub = sinon.stub(Genexample.prototype, 'run')
  stub.returns({})

  main.genexample()

  t.ok(stub.called, 'new Genexample().run() called')

  stub.restore()

  ct.end()
})
