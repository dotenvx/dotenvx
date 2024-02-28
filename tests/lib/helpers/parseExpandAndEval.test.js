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

  const parsed = parseExpandAndEval(src, true)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})
