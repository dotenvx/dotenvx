const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const findOrCreatePublicKey = require('../../../src/lib/helpers/findOrCreatePublicKey')

let writeFileSyncStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#findOrCreatePublicKey when DOTENV_PUBLIC_KEY is found', ct => {
  const {
    publicKey,
    privateKey
  } = findOrCreatePublicKey('tests/monorepo/apps/encrypted/.env', 'tests/monorepo/apps/encrypted/.env.keys')

  ct.same(publicKey, '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba')
  ct.same(privateKey, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})
