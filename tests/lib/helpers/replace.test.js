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
  const src = 'HELLO="$(echo world)"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace empty', ct => {
  const src = 'HELLO='

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace empty backticks', ct => {
  const src = 'HELLO=``'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace spaced single quotes', ct => {
  const src = 'HELLO=\'    single quote   \''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace spaced double quotes', ct => {
  const src = 'HELLO="    single quote   "'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace double quotes inside single quotes', ct => {
  const src = 'HELLO=\'double "quotes" inside single quotes'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace single quotes inside double quotes', ct => {
  const src = 'HELLO="single \'quotes\' inside single quotes"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace double quotes and single quotes inside backticks', ct => {
  const src = 'HELLO=`double "quotes" and single \'quotes\' inside backticks`'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace newlines', ct => {
  const src = 'HELLO="expand\nnew\nlines"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace unquoted newlines', ct => {
  const src = 'HELLO=dontexpand\nnewlines'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace inline comments', ct => {
  const src = 'HELLO=inline comments # work #very #well'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"# work #very #well')

  ct.end()
})

t.test('#replace inline comments', ct => {
  const src = 'HELLO=inline comments # work #very #well'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"# work #very #well') // make a little smarter to handle the spaces

  ct.end()
})

t.test('#replace hashtag in quotes', ct => {
  const src = 'HELLO="hash #tag quoted"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace equal signs', ct => {
  const src = 'HELLO=equals=='

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace inner quotes', ct => {
  const src = 'HELLO={"foo": "bar"}'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace inner quotes as string', ct => {
  const src = 'HELLO=\'{"foo": "bar"}\''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

t.test('#replace inner quotes as backticks', ct => {
  const src = 'HELLO=`{"foo": "bar\'s"}`'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="Universe"')

  ct.end()
})

// TODO: handle leading space
// t.test('#replace spaced key', ct => {
//   const src = '     HELLO=parsed'
//
//   const newSrc = replace(src, 'HELLO', 'Universe')
//   ct.same(newSrc, '     HELLO="Universe"')
//
//   ct.end()
// })

t.test('#replace somewhere in the middle', ct => {
  const src = `VAR_1=val_1
VAR_2=val_2
VAR_3=val_3
VAR_4=val_4`

  const newSrc = replace(src, 'VAR_2', 'val_2b')

  const expected = `VAR_1=val_1
VAR_2="val_2b"
VAR_3=val_3
VAR_4=val_4`

  ct.same(newSrc, expected)

  ct.end()
})
