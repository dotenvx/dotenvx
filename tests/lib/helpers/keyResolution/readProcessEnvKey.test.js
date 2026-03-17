const t = require('tap')

const readProcessEnvKey = require('../../../../src/lib/helpers/keyResolution/readProcessEnvKey')

t.beforeEach(() => {
  process.env = {}
})

t.test('#readProcessEnvKey returns value when key exists and non-empty', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  const result = readProcessEnvKey('DOTENV_PRIVATE_KEY')

  ct.same(result, '<privateKey>')
  ct.end()
})

t.test('#readProcessEnvKey returns undefined when key exists but empty', ct => {
  process.env.DOTENV_PRIVATE_KEY = ''

  const result = readProcessEnvKey('DOTENV_PRIVATE_KEY')

  ct.same(result, undefined)
  ct.end()
})

t.test('#readProcessEnvKey returns undefined when key does not exist', ct => {
  const result = readProcessEnvKey('DOTENV_PRIVATE_KEY')

  ct.same(result, undefined)
  ct.end()
})
