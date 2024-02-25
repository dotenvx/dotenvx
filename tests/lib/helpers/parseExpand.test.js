const t = require('tap')

const parseExpand = require('../../../src/lib/helpers/parseExpand')

let src = 'HELLO=World'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#parseExpand', ct => {
  const parsed = parseExpand(src)

  ct.same(parsed, { HELLO: 'World' })

  ct.end()
})

t.test('#parseExpand machine value already set', ct => {
  process.env.HELLO = 'machine'

  const parsed = parseExpand(src)

  ct.same(parsed, { HELLO: 'machine' })

  ct.end()
})

t.test('#parseExpand machine value already set but overload true', ct => {
  process.env.HELLO = 'machine'

  const parsed = parseExpand(src, true)

  ct.same(parsed, { HELLO: 'World' })

  ct.end()
})

t.test('#parseExpand expands from process.env', ct => {
  process.env.EXPAND = 'expanded'

  src = 'HELLO=$EXPAND'

  const parsed = parseExpand(src, true)

  ct.same(parsed, { HELLO: 'expanded' })

  ct.end()
})

t.test('#parseExpand expands from self file', ct => {
  src = `HELLO=$EXPAND
EXPAND=self`

  const parsed = parseExpand(src, true)

  ct.same(parsed, { HELLO: 'self', EXPAND: 'self' })

  ct.end()
})

t.test('#parseExpand expands recursively from self file', ct => {
  src = `HELLO=$ONE
ONE=$TWO
TWO=hiya
`

  const parsed = parseExpand(src, true)

  ct.same(parsed, { HELLO: 'hiya', ONE: 'hiya', TWO: 'hiya' })

  ct.end()
})
