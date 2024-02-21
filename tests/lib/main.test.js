const t = require('tap')
const sinon = require('sinon')

const main = require('../../src/lib/main')

const Encrypt = require('../../src/lib/services/encrypt')
const Get = require('../../src/lib/services/get')

t.test('ls calls Ls.run', ct => {
  const envFiles = main.ls('tests')

  const expected = [
    '.env.vault',
    '.env.multiline',
    '.env.local',
    '.env.expand',
    '.env',
    'monorepo/apps/frontend/.env',
    'monorepo/apps/backend/.env.vault',
    'monorepo/apps/backend/.env.keys',
    'monorepo/apps/backend/.env'
  ]

  ct.same(envFiles, expected)

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
