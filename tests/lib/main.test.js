const t = require('tap')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../src/lib/main')

const Ls = require('../../src/lib/services/ls')
const Get = require('../../src/lib/services/get')
const Run = require('../../src/lib/services/run')
const Sets = require('../../src/lib/services/sets')
const Encrypt = require('../../src/lib/services/encrypt')
const Decrypt = require('../../src/lib/services/decrypt')
const Genexample = require('../../src/lib/services/genexample')
const VaultEncrypt = require('../../src/lib/services/vaultEncrypt')

t.test('config calls Run.run', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

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

t.test('encrypt calls Encrypt.run', ct => {
  const stub = sinon.stub(Encrypt.prototype, 'run')
  stub.returns({})

  main.encrypt()

  t.ok(stub.called, 'new Encrypt().run() called')

  stub.restore()

  ct.end()
})

t.test('decrypt calls Decrypt.run', ct => {
  const stub = sinon.stub(Decrypt.prototype, 'run')
  stub.returns({})

  main.decrypt()

  t.ok(stub.called, 'new Decrypt().run() called')

  stub.restore()

  ct.end()
})

t.test('vaultEncrypt calls VaultEncrypt.run', ct => {
  const stub = sinon.stub(VaultEncrypt.prototype, 'run')
  stub.returns({})

  main.vaultEncrypt()

  t.ok(stub.called, 'new VaultEncrypt().run() called')

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

t.test('set calls Sets.run', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({})

  main.set()

  t.ok(stub.called, 'new Sets().run() called')

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
