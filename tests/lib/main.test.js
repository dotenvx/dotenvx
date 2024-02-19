const t = require('tap')
const sinon = require('sinon')

const dotenvx = require('../../src/lib/main')

const DotenvKeys = require('../../src/lib/helpers/dotenvKeys')

t.test('ls calls Ls.run', ct => {
  const envFiles = dotenvx.ls()

  const expected = [
    'tests/.env.vault',
    'tests/.env.multiline',
    'tests/.env.local',
    'tests/.env.expand',
    'tests/.env',
    'tests/monorepo-example/apps/frontend/.env',
    'tests/monorepo-example/apps/backend/.env.keys',
    'tests/monorepo-example/apps/backend/.env'
  ]

  ct.same(envFiles, expected)

  ct.end()
})

t.test('encrypt calls Encrypt.run', ct => {
  dotenvKeysRunStub = sinon.stub(DotenvKeys.prototype, 'run')
  dotenvKeysRunStub.returns({ envKeys: '<.env.keys content>', addedKeys: ['DOTENV_KEY_DEVELOPMENT'], existingKeys: [] })

  const { envKeys, addedKeys, existingKeys, envVault } = dotenvx.encrypt()

  ct.same(envKeys, '<.env.keys content>')
  ct.same(addedKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(existingKeys, [])

  dotenvKeysRunStub.restore()

  ct.end()
})
