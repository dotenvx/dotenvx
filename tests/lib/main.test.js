const t = require('tap')
const sinon = require('sinon')
const dotenv = require('dotenv')

const main = require('../../src/lib/main')

const Encrypt = require('../../src/lib/services/encrypt')
const Ls = require('../../src/lib/services/ls')
const Get = require('../../src/lib/services/get')

t.test('config calls dotenv.config', ct => {
  const stub = sinon.stub(dotenv, 'config')
  stub.returns({})

  main.config()

  t.ok(stub.called, 'dotenv.config() called')

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
