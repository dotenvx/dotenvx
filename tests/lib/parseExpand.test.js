const t = require('tap')

const parseExpand = require('../../src/lib/helpers/parseExpand')
const logger = require('../../src/shared/logger')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
  logger.level = 'info'
})

t.test('returns object', ct => {
  const dotenv = { parsed: {} }
  const parsed = parseExpand(dotenv)

  t.ok(parsed instanceof Object, 'should be an object')

  ct.end()
})

t.test('expands environment variables', ct => {
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const parsed = parseExpand(src)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(parsed.BASIC_EXPAND, 'basic')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'basic')

  ct.end()
})

t.test('expands environment variables (pre-existing no overload)', ct => {
  process.env.BASIC = 'pre-existing'
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const parsed = parseExpand(src)

  ct.equal(parsed.BASIC, 'pre-existing')
  ct.equal(parsed.BASIC_EXPAND, 'pre-existing')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'pre-existing')

  ct.end()
})

t.test('expands environment variables (pre-existing when overload is true)', ct => {
  process.env.BASIC = 'pre-existing'
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const parsed = parseExpand(src, true)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(parsed.BASIC_EXPAND, 'basic')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'basic')

  ct.end()
})

t.test('uses environment variables existing already on the machine for expansion', ct => {
  process.env.MACHINE = 'machine'
  const src = `
    MACHINE_EXPAND=\${MACHINE}
    MACHINE_EXPAND_SIMPLE=$MACHINE
  `
  const parsed = parseExpand(src)

  ct.equal(parsed.MACHINE_EXPAND, 'machine')
  ct.equal(parsed.MACHINE_EXPAND_SIMPLE, 'machine')

  ct.end()
})

t.test('only returns keys part of the original input. process.env is used for help with expansion only here and not returned', ct => {
  process.env.MACHINE = 'machine'
  const src = `
    MACHINE_EXPAND=\${MACHINE}
    MACHINE_EXPAND_SIMPLE=$MACHINE
  `
  const parsed = parseExpand(src)

  ct.equal(parsed.MACHINE, undefined)

  ct.end()
})
