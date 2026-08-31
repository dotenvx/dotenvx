const t = require('tap')

const normalizeDotenvConfigConvention = require('../../../src/lib/helpers/normalizeDotenvConfigConvention')

t.beforeEach(() => {
  delete process.env.DOTENV_CONVENTION
  delete process.env.DOTENV_CONFIG_CONVENTION
})

t.afterEach(() => {
  delete process.env.DOTENV_CONVENTION
  delete process.env.DOTENV_CONFIG_CONVENTION
})

t.test('uses DOTENV_CONVENTION', t => {
  process.env.DOTENV_CONVENTION = 'flow'

  t.equal(normalizeDotenvConfigConvention({}).convention, 'flow')
  t.end()
})

t.test('falls back to DOTENV_CONFIG_CONVENTION', t => {
  process.env.DOTENV_CONFIG_CONVENTION = 'nextjs'

  t.equal(normalizeDotenvConfigConvention({}).convention, 'nextjs')
  t.end()
})

t.test('DOTENV_CONVENTION takes precedence over DOTENV_CONFIG_CONVENTION', t => {
  process.env.DOTENV_CONVENTION = 'flow'
  process.env.DOTENV_CONFIG_CONVENTION = 'nextjs'

  t.equal(normalizeDotenvConfigConvention({}).convention, 'flow')
  t.end()
})

t.test('explicit convention takes precedence', t => {
  process.env.DOTENV_CONVENTION = 'flow'

  t.equal(normalizeDotenvConfigConvention({ convention: 'nextjs' }).convention, 'nextjs')
  t.end()
})
