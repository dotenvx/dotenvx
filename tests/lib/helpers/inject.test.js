const t = require('tap')

const inject = require('../../../src/lib/helpers/inject')

t.test('#inject', ct => {
  const processEnv = {}
  const parsed = { HELLO: 'World' }

  const { injected, preExisted } = inject(processEnv, parsed, true)

  ct.same(injected, { HELLO: 'World' })
  ct.same(preExisted, {})

  ct.end()
})

t.test('#inject with pre-existing', ct => {
  const processEnv = { HELLO: 'machine' }
  const parsed = { HELLO: 'World' }

  const { injected, preExisted } = inject(processEnv, parsed, false)

  ct.same(injected, {})
  ct.same(preExisted, { HELLO: 'machine' })

  ct.end()
})

t.test('#inject with pre-existing falsy value', ct => {
  const processEnv = { HELLO: '' }
  const parsed = { HELLO: 'World' }

  const { injected, preExisted } = inject(processEnv, parsed, false)

  ct.same(injected, {})
  ct.same(preExisted, { HELLO: '' })

  ct.end()
})

t.test('#inject with pre-existing but overload is true', ct => {
  const processEnv = { HELLO: 'machine' }
  const parsed = { HELLO: 'World' }

  const { injected, preExisted } = inject(processEnv, parsed, true)

  ct.same(injected, { HELLO: 'World' })
  ct.same(preExisted, {})

  ct.end()
})

t.test('#inject with pre-existing but overload is false', ct => {
  const processEnv = { HELLO: 'machine' }
  const parsed = { HELLO: 'World' }

  const { injected, preExisted } = inject(processEnv, parsed, false)

  ct.same(injected, {})
  ct.same(preExisted, { HELLO: 'machine' })

  ct.end()
})

t.test('#inject with no arguments', ct => {
  const { injected, preExisted } = inject()

  ct.same(injected, {})
  ct.same(preExisted, {})

  ct.end()
})
