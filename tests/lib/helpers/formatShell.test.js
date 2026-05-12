const t = require('tap')

const formatShell = require('../../../src/lib/helpers/formatShell')

t.test('formatShell formats shell assignments', ct => {
  const result = formatShell({ HELLO: 'World', KEY: "f'bar" })

  ct.equal(result, "HELLO=World KEY=f'bar")
  ct.end()
})

t.test('formatShell rejects values that would split into multiple shell words', ct => {
  ct.throws(
    () => formatShell({ GREETING: 'hello NODE_OPTIONS=--require=./payload.js' }),
    /cannot format GREETING as shell/
  )

  ct.end()
})
