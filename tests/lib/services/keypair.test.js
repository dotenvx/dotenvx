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

t.test('#runSync (no arguments)',
  async ct => {
    const result = await new Keypair().runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: null, DOTENV_PRIVATE_KEY: null })

    ct.end()
  })

t.test('#runSync (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair(envFile).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#runSync (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair([envFile]).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })
