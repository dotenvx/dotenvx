const t = require('tap')

const readProcessKey = require('../../../../src/lib/helpers/keyResolution/readProcessKey')

t.beforeEach(() => {
  process.env = {}
})

t.test('#readProcessKey returns value when key exists and non-empty', ct => {
  process.env.DOTENV_PRIVATE_KEY = '<privateKey>'

  const result = readProcessKey('DOTENV_PRIVATE_KEY')

  ct.same(result, '<privateKey>')
  ct.end()
})

t.test('#readProcessKey returns undefined when key exists but empty', ct => {
  process.env.DOTENV_PRIVATE_KEY = ''

  const result = readProcessKey('DOTENV_PRIVATE_KEY')

  ct.same(result, undefined)
  ct.end()
})

t.test('#readProcessKey returns undefined when key does not exist', ct => {
  const result = readProcessKey('DOTENV_PRIVATE_KEY')

  ct.same(result, undefined)
  ct.end()
})
