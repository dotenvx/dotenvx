const t = require('tap')

const Keypair = require('../../../src/lib/services/keypair')

t.beforeEach((ct) => {
  process.env = {}
})

t.test('#runSync (no arguments)',
  async ct => {
    ct.throws(() => new Keypair().runSync(), { code: 'ENOENT' })

    ct.end()
  })

t.test('#runSync (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair({ envFile }).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#runSync (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = new Keypair({ envFile: [envFile] }).runSync()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (no arguments)',
  async ct => {
    await ct.rejects(new Keypair().run(), { code: 'ENOENT' })

    ct.end()
  })

t.test('#run (finds .env file)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair({ envFile }).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })

t.test('#run (finds .env file as array)',
  async ct => {
    const envFile = 'tests/monorepo/apps/encrypted/.env'
    const result = await new Keypair({ envFile: [envFile] }).run()

    ct.same(result, { DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba', DOTENV_PRIVATE_KEY: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })

    ct.end()
  })
