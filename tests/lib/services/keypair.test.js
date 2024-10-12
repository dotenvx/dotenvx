const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const Keypair = require('../../../src/lib/services/keypair')

let writeFileSyncStub

t.beforeEach((ct) => {
  process.env = {}
  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#run (no arguments)', ct => {
  const result = new Keypair().run()

  ct.same(result, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const result = new Keypair(envFile).run()

  ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const result = new Keypair([envFile]).run()

  ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

  ct.end()
})

t.test('#run (finds .env file with specified key)', ct => {
  const envFile = 'tests/monorepo/apps/encrypted/.env'
  const result = new Keypair(envFile, 'DOTENV_PRIVATE_KEY').run()

  ct.same(result, 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1')

  ct.end()
})
