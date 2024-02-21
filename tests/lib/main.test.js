const t = require('tap')
const sinon = require('sinon')

const main = require('../../src/lib/main')

const Encrypt = require('../../src/lib/services/encrypt')
const Ls = require('../../src/lib/services/ls')
const Get = require('../../src/lib/services/get')

t.test('ls calls Ls.run', ct => {
  const lsRunStub = sinon.stub(Ls.prototype, 'run')
  lsRunStub.returns({})

  main.ls()

  t.ok(lsRunStub.called, 'new Ls().run() called')

  lsRunStub.restore()

  ct.end()
})

t.test('encrypt calls Encrypt.run', ct => {
  const encryptRunStub = sinon.stub(Encrypt.prototype, 'run')
  encryptRunStub.returns({})

  main.encrypt()

  t.ok(encryptRunStub.called, 'new Encrypt().run() called')

  encryptRunStub.restore()

  ct.end()
})

t.test('get calls Get.run', ct => {
  const getRunStub = sinon.stub(Get.prototype, 'run')
  getRunStub.returns({})

  main.get()

  t.ok(getRunStub.called, 'new Get().run() called')

  getRunStub.restore()

  ct.end()
})
