const t = require('tap')

const normalizeDotenvConfigQuiet = require('../../../src/lib/helpers/normalizeDotenvConfigQuiet')

t.beforeEach(() => {
  delete process.env.DOTENV_QUIET
  delete process.env.DOTENV_CONFIG_QUIET
})

t.afterEach(() => {
  delete process.env.DOTENV_QUIET
  delete process.env.DOTENV_CONFIG_QUIET
})

t.test('uses DOTENV_QUIET', t => {
  process.env.DOTENV_QUIET = 'true'

  t.equal(normalizeDotenvConfigQuiet({}).quiet, true)
  t.end()
})

t.test('falls back to DOTENV_CONFIG_QUIET', t => {
  process.env.DOTENV_CONFIG_QUIET = 'true'

  t.equal(normalizeDotenvConfigQuiet({}).quiet, true)
  t.end()
})

t.test('DOTENV_QUIET takes precedence over DOTENV_CONFIG_QUIET', t => {
  process.env.DOTENV_QUIET = 'false'
  process.env.DOTENV_CONFIG_QUIET = 'true'

  t.equal(normalizeDotenvConfigQuiet({}).quiet, undefined)
  t.end()
})
