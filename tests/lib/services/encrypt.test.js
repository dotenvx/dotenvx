const t = require('tap')
const sinon = require('sinon')
const DotenvKeys = require('../../../src/lib/helpers/dotenvKeys')

const Encrypt = require('../../../src/lib/services/encrypt')

t.test('#run', ct => {
  dotenvKeysRunStub = sinon.stub(DotenvKeys.prototype, 'run')
  dotenvKeysRunStub.returns({ envKeys: '<.env.keys content>', addedKeys: ['DOTENV_KEY_DEVELOPMENT'], existingKeys: [] })

  const { envKeys, addedKeys, existingKeys, envVault } = new Encrypt().run()

  ct.same(envKeys, '<.env.keys content>')
  ct.same(addedKeys, ['DOTENV_KEY_DEVELOPMENT'])
  ct.same(existingKeys, [])

  dotenvKeysRunStub.restore()

  ct.end()
})
