const t = require('tap')
const dotenv = require('dotenv')

const replaceRaw = require('../../../src/lib/helpers/replaceRaw')

const src = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

t.test('appends new key', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected + '\nDOESNOTEXIST=\'ttt\'')
  ct.same(dotenv.parse(newSrc).DOESNOTEXIST, 'ttt')
  ct.end()
})

t.test('appends when ending newline', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)


`

  const newSrc = replaceRaw(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected.trim() + '\nDOESNOTEXIST=\'ttt\'')
  ct.same(dotenv.parse(newSrc).DOESNOTEXIST, 'ttt')
  ct.end()
})

t.test('HELLO', ct => {
  const expected = `HELLO='ttt'
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'HELLO', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).HELLO, 'ttt')
  ct.end()
})

t.test('#SPACER', ct => {
  const expected = `HELLO=a
SPACER='ttt'
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'SPACER', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).SPACER, 'ttt')
  ct.end()
})

t.test('#SPACEL', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL='ttt'
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'SPACEL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).SPACEL, 'ttt')
  ct.end()
})

t.test('#SPACEB', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB='ttt'
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'SPACEB', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).SPACEB, 'ttt')
  ct.end()
})

t.test('#SINGLE', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='ttt'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'SINGLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).SINGLE, 'ttt')
  ct.end()
})

t.test('#DOUBLE', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE='ttt'
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'DOUBLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).DOUBLE, 'ttt')
  ct.end()
})

t.test('#JSON', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON='{"other": 2}'
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'JSON', '{"other": 2}')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).JSON, '{"other": 2}')
  ct.end()
})

t.test('#QUOTE', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE='"'
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'QUOTE', '"')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).QUOTE, '"')
  ct.end()
})

t.test('#QUOTE2', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2="'"
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'QUOTE2', "'")
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).QUOTE, "'")
  ct.end()
})

t.test('#EXPORT', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT='ttt'
EXPORT2='export EXPORT=k'
export EXPORT='ttt'
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'EXPORT', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).EXPORT, 'ttt')
  ct.end()
})

t.test('#PAD', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD='ttt'
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'PAD', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).PAD, 'ttt')
  ct.end()
})

t.test('#BAD', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD='f"bar'
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'BAD', 'f"bar')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).BAD, 'f"bar')
  ct.end()
})

t.test('#BAD2', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2="f'bar"
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'BAD2', "f'bar")
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).BAD2, 'f\'bar')
  ct.end()
})

t.test('#MULTI', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='ttt'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'MULTI', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).MULTI, 'ttt')
  ct.end()
})

t.test('#MULTI2', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="hi
my
friend"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'MULTI2', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).MULTI2, `hi
my
friend`)
  ct.end()
})

t.test('#MULTI3', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3="hi
my
friend"
EVAL=$(echo world)`

  const newSrc = replaceRaw(src, 'MULTI3', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).MULTI3, `hi
my
friend`)
  ct.end()
})

t.test('#EVAL', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
QUOTE="'"
QUOTE2='"'
export EXPORT=k
EXPORT2='export EXPORT=k'
export EXPORT=k
  PAD=l
BAD=f'bar
BAD2=f"bar
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----'
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----"
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----\`
EVAL='ttt'`

  const newSrc = replaceRaw(src, 'EVAL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(dotenv.parse(newSrc).EVAL, 'ttt')
  ct.end()
})
