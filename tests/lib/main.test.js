const t = require('tap')
const sinon = require('sinon')

const main = require('../../src/lib/main')

const Ls = require('../../src/lib/services/ls')
const Get = require('../../src/lib/services/get')
const Run = require('../../src/lib/services/run')
const Keypair = require('../../src/lib/services/keypair')
const Genexample = require('../../src/lib/services/genexample')
const Parse = require('../../src/lib/helpers/parse')

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

t.test('config with Run.run errors', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const error = new Error('some error')
  error.help = 'some help'
  const errors = [error]
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerErrorStub.calledWith('some error'), 'console.error')
  ct.ok(loggerHelpStub.calledWith('some help'), 'logger.help')

  stub.restore()
  loggerErrorStub.restore()
  loggerHelpStub.restore()

  ct.end()
})

t.test('config with Run.run processedEnv with undefined processedEnv.errors', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{}], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('parse calls Parse.run', ct => {
  const stub = sinon.stub(Parse.prototype, 'run')
  stub.returns({})

  main.parse()

  t.ok(stub.called, 'new Parse().run() called')

  stub.restore()

  ct.end()
})

t.test('parse calls Parse.run with options.processEnv', ct => {
  const stub = sinon.stub(Parse.prototype, 'run')
  stub.returns({})

  main.parse('HELLO=World', { processEnv: {} })

  t.ok(stub.called, 'new Parse().run() called')

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
