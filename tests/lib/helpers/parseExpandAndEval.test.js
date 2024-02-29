const t = require('tap')

const parseExpandAndEval = require('../../../src/lib/helpers/parseExpandAndEval')

let src = 'HELLO=World'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#parseExpandAndEval', ct => {
  const parsed = parseExpandAndEval(src)

  ct.same(parsed, { HELLO: 'World' })

  ct.end()
})

t.test('#parseExpandAndEval machine value already set', ct => {
  process.env.HELLO = 'machine'

  const parsed = parseExpandAndEval(src)

  ct.same(parsed, { HELLO: 'machine' })

  ct.end()
})

t.test('#parseExpandAndEval machine value already set but overload true', ct => {
  process.env.HELLO = 'machine'

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'World' })

  ct.end()
})

t.test('#parseExpandAndEval expands from process.env', ct => {
  process.env.EXPAND = 'expanded'

  src = 'HELLO=$EXPAND'

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'expanded' })

  ct.end()
})

t.test('#parseExpandAndEval expands from self file', ct => {
  src = `HELLO=$EXPAND
EXPAND=self`

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'self', EXPAND: 'self' })

  ct.end()
})

t.test('#parseExpandAndEval expands recursively from self file', ct => {
  src = `HELLO=$ONE
ONE=$TWO
TWO=hiya
`

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'hiya', ONE: 'hiya', TWO: 'hiya' })

  ct.end()
})

t.test('#parseExpandAndEval command substitutes', ct => {
  src = 'HELLO=$(echo world)'

  const parsed = parseExpandAndEval(src)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('#parseExpandAndEval command substitutes (already set in processEnv to same value)', ct => {
  process.env.HELLO = '$(echo world)'

  src = 'HELLO=$(echo world)'

  const parsed = parseExpandAndEval(src)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('#parseExpandAndEval machine command already set', ct => {
  process.env.HELLO = '$(echo machine)'

  src = 'HELLO=$(echo world)'

  const parsed = parseExpandAndEval(src)

  ct.same(parsed, { HELLO: 'machine' })

  ct.end()
})

t.test('#parseExpandAndEval machine command already set but overload true', ct => {
  process.env.HELLO = '$(echo machine)'

  src = 'HELLO=$(echo world)'

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('returns object', ct => {
  const dotenv = { parsed: {} }
  const parsed = parseExpandAndEval(dotenv)

  t.ok(parsed instanceof Object, 'should be an object')

  ct.end()
})

t.test('expands environment variables', ct => {
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const parsed = parseExpandAndEval(src)

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
  const parsed = parseExpandAndEval(src)

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
  const parsed = parseExpandAndEval(src, true)

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
  const parsed = parseExpandAndEval(src)

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
  const parsed = parseExpandAndEval(src)

  ct.equal(parsed.MACHINE, undefined)

  ct.end()
})
