const t = require('tap')

const parseDecryptEvalExpand = require('../../../src/lib/helpers/parseDecryptEvalExpand')

let src = 'HELLO=World'

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  // reset
  src = 'HELLO=World'
})

t.test('#parseDecryptEvalExpand', ct => {
  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'World' })

  ct.end()
})

t.test('#parseDecryptEvalExpand with encrypted value', ct => {
  src = 'HELLO=encrypted:BA9cBZml/SqizWFcPJqiT+0EAeJ2Vlb4aKfrAma4G19sPHEYsIu9C0EhqM6CnTJRVX0srj1BW4a9k3XwbkLFGN1vmAUAVxzFsoEFyPXPJJ+dB8wzcVMim6Ako4+QmVWlSn2FR/wc6y6B'

  const privateKey = 'd607fffc83656d0658c6de64d1d9a10f5d0bfbcd437f2a93bd0e1afa5f192626'

  const { parsed } = parseDecryptEvalExpand(src, privateKey)

  ct.same(parsed, { HELLO: 'Universe' })

  ct.end()
})

t.test('#parseDecryptEvalExpand with encrypted value as empty string', ct => {
  src = 'HELLO=encrypted:BGKyYqb2aCT1GJQnluY7LGgHZvrHL9+w6LtFp+fxxc3AYSWt+z0P/xYUdZu/uWy5psgk2jfJfDV3P0MpL4V6/r2DMWvnNAzzshf3vPFg9FG1mpn9qNGxPcwoYoT6YKF0Nw=='

  const privateKey = 'd470775e64ae4cfe617b14f9ce3800e1c5a7fd773b57aa0471ed6e3e5060ffce'

  const { parsed } = parseDecryptEvalExpand(src, privateKey)

  ct.same(parsed, { HELLO: '' })

  ct.end()
})

t.test('#parseDecryptEvalExpand machine value already set', ct => {
  process.env.HELLO = 'machine'

  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.same(parsed.HELLO, 'World')
  ct.same(processEnv.HELLO, 'machine')

  ct.end()
})

t.test('#parseDecryptEvalExpand expands from process.env', ct => {
  process.env.EXPAND = 'expanded'

  src = 'HELLO=$EXPAND'

  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'expanded' })
  ct.same(processEnv.HELLO, 'expanded')
  ct.same(process.env.HELLO, 'expanded')

  ct.end()
})

t.test('#parseDecryptEvalExpand expands from self file', ct => {
  src = `HELLO=$EXPAND
EXPAND=self`

  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'self', EXPAND: 'self' })

  ct.end()
})

t.test('#parseDecryptEvalExpand expands recursively from self file', ct => {
  src = `HELLO=$ONE
ONE=$TWO
TWO=hiya
`

  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'hiya', ONE: 'hiya', TWO: 'hiya' })

  ct.end()
})

t.test('#parseDecryptEvalExpand command substitutes', ct => {
  src = 'HELLO=$(echo world)'

  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('#parseDecryptEvalExpand command does substitute (already set in processEnv to same value)', ct => {
  process.env.HELLO = '$(echo world)'

  src = 'HELLO=$(echo world)'

  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('#parseDecryptEvalExpand machine command does not substitute (holman dotfiles issue https://github.com/dotenvx/dotenvx/issues/123)', ct => {
  process.env.HELLO = '$(echo machine)'

  src = 'HELLO=$(echo world)'

  const { parsed } = parseDecryptEvalExpand(src)

  ct.same(parsed, { HELLO: 'world' })

  ct.end()
})

t.test('returns object', ct => {
  const dotenv = { parsed: {} }
  const { parsed } = parseDecryptEvalExpand(dotenv)

  t.ok(parsed instanceof Object, 'should be an object')

  ct.end()
})

t.test('expands environment variables', ct => {
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const { parsed } = parseDecryptEvalExpand(src)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(parsed.BASIC_EXPAND, 'basic')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'basic')

  ct.end()
})

t.test('expands environment variables (pre-existing but treats everything as overload)', ct => {
  process.env.BASIC = 'pre-existing'
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const { parsed } = parseDecryptEvalExpand(src)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(parsed.BASIC_EXPAND, 'basic')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'basic')

  ct.end()
})

t.test('expands environment variables (pre-existing when overload is true)', ct => {
  process.env.BASIC = 'pre-existing'
  const src = `
    BASIC=basic
    BASIC_EXPAND=\${BASIC}
    BASIC_EXPAND_SIMPLE=$BASIC
  `
  const { parsed } = parseDecryptEvalExpand(src)

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
  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.equal(parsed.MACHINE, undefined)
  ct.equal(parsed.MACHINE_EXPAND, 'machine')
  ct.equal(parsed.MACHINE_EXPAND_SIMPLE, 'machine')
  ct.equal(processEnv.MACHINE, 'machine')
  ct.equal(processEnv.MACHINE_EXPAND, 'machine')
  ct.equal(processEnv.MACHINE_EXPAND_SIMPLE, 'machine')

  ct.end()
})

t.test('only returns keys part of the original input. process.env is used for help with expansion only here and not returned as part of parsed', ct => {
  process.env.MACHINE = 'machine'
  const src = `
    MACHINE_EXPAND=\${MACHINE}
    MACHINE_EXPAND_SIMPLE=$MACHINE
  `
  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.equal(parsed.MACHINE, undefined)
  ct.equal(processEnv.MACHINE, 'machine')
  ct.equal(processEnv.MACHINE_EXPAND, 'machine')
  ct.equal(processEnv.MACHINE_EXPAND_SIMPLE, 'machine')

  ct.end()
})

t.test('falsey value already in process.env', ct => {
  process.env.BASIC = ''
  const src = 'BASIC=basic'
  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(processEnv.BASIC, '')

  ct.end()
})

t.test('no value in process.env', ct => {
  const src = 'BASIC=basic'
  const { parsed, processEnv } = parseDecryptEvalExpand(src)

  ct.equal(parsed.BASIC, 'basic')
  ct.equal(processEnv.BASIC, undefined)
  ct.equal(process.env.BASIC, undefined)

  ct.end()
})
