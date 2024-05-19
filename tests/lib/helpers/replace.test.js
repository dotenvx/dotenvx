const t = require('tap')

const replace = require('../../../src/lib/helpers/replace')

t.test('#replace', ct => {
  const src = 'HELLO=World'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace with single quotes', ct => {
  const src = 'HELLO=\'World\''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace with double quotes', ct => {
  const src = 'HELLO="World"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace appends when key does not yet exist', ct => {
  const src = 'HELLO=World'

  const newSrc = replace(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY="1234"')

  ct.end()
})

t.test('#replace appends smartly if ending newline already', ct => {
  const src = 'HELLO=World\n'

  const newSrc = replace(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY="1234"\n')

  ct.end()
})

t.test('#replace with double quoted multiline', ct => {
  const src = `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----"`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace with single quoted multiline', ct => {
  const src = `HELLO='-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----'`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace with backtick quoted multiline', ct => {
  const src = `HELLO=\`-----BEGIN RSA PRIVATE KEY-----
THIS
IS
"MULTILINE's"
-----END RSA PRIVATE KEY-----\``

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace evals', ct => {
  const src = `HELLO="$(echo world)"`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace expands', ct => {
  const src = `HELLO=$\{MACHINE-$\{UNDEFINED-default\}\}"`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})
