const t = require('tap')
const { parse } = require('../../../src/lib/main')

const replace = require('../../../src/lib/helpers/replace')

const src = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

t.test('appends new key', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected + '\nDOESNOTEXIST=\'ttt\'')
  ct.same(parse(newSrc).DOESNOTEXIST, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED


`

  const newSrc = replace(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected.trim() + '\nDOESNOTEXIST=\'ttt\'')
  ct.same(parse(newSrc).DOESNOTEXIST, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'HELLO', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).HELLO, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'SPACER', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACER, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'SPACEL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACEL, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'SPACEB', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACEB, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'SINGLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SINGLE, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'DOUBLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).DOUBLE, 'ttt')
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
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'JSON', '{"other": 2}')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).JSON, '{"other": 2}')
  ct.end()
})

t.test('#JSON2', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2='{"other": 2}'
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'JSON2', '{"other": 2}')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).JSON2, '{"other": 2}')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'QUOTE', '"')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).QUOTE, '"')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'QUOTE2', "'")
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).QUOTE, "'")
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'EXPORT', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EXPORT, 'ttt')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'PAD', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).PAD, 'ttt')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'BAD', 'f"bar')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).BAD, 'f"bar')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'BAD2', "f'bar")
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).BAD2, 'f\'bar')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'MULTI', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI, 'ttt')
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'MULTI2', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI2, `hi
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
JSON2="{"hi": 1}"
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
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'MULTI3', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI3, `hi
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
JSON2="{"hi": 1}"
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
EVAL='ttt'
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'EVAL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EVAL, 'ttt')
  ct.end()
})

t.test('#EMPTY', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY='ttt'
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'EMPTY', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EMPTY, 'ttt')
  ct.end()
})

t.test('#NEWLINES', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES='ttt'
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'NEWLINES', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).NEWLINES, 'ttt')
  ct.end()
})

t.test('#COMMENT', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT='ttt' # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'COMMENT', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).COMMENT, 'ttt')
  ct.end()
})

t.test('#HASHTAG', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG='ttt'
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'HASHTAG', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).HASHTAG, 'ttt')
  ct.end()
})

t.test('#D.O.T.S', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S='ttt'
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'D.O.T.S', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc)['D.O.T.S'], 'ttt')
  ct.end()
})

t.test('#DONT_CHOKE1', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='ttt'
ESCAPED=\`ESCAPED`

  const newSrc = replace(src, 'DONT_CHOKE1', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).DONT_CHOKE1, 'ttt')
  ct.end()
})

t.test('#ESCAPED', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f"
BACKTICK=\`g\`
JSON={"hi": 1}
JSON2="{"hi": 1}"
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
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED='ttt'`

  const newSrc = replace(src, 'ESCAPED', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).ESCAPED, 'ttt')
  ct.end()
})

t.test('#replace', ct => {
  const src = 'HELLO=World'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace with single quotes', ct => {
  const src = 'HELLO=\'World\''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace with double quotes', ct => {
  const src = 'HELLO="World"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace appends when key does not yet exist', ct => {
  const src = 'HELLO=World'

  const newSrc = replace(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY=\'1234\'')

  ct.end()
})

t.test('#replace appends smartly if ending newline already', ct => {
  const src = 'HELLO=World\n'

  const newSrc = replace(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY=\'1234\'\n')

  ct.end()
})

t.test('#replace with double quoted multiline', ct => {
  const src = `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----"`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace with single quoted multiline', ct => {
  const src = `HELLO='-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----'`

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace with backtick quoted multiline', ct => {
  const src = `HELLO=\`-----BEGIN RSA PRIVATE KEY-----
THIS
IS
"MULTILINE's"
-----END RSA PRIVATE KEY-----\``

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace evals', ct => {
  const src = 'HELLO="$(echo world)"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace empty', ct => {
  const src = 'HELLO='

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace empty backticks', ct => {
  const src = 'HELLO=``'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace spaced single quotes', ct => {
  const src = 'HELLO=\'    single quote   \''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace spaced double quotes', ct => {
  const src = 'HELLO="    single quote   "'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace double quotes inside single quotes', ct => {
  const src = 'HELLO=\'double "quotes" inside single quotes'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace single quotes inside double quotes', ct => {
  const src = 'HELLO="single \'quotes\' inside single quotes"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace double quotes and single quotes inside backticks', ct => {
  const src = 'HELLO=`double "quotes" and single \'quotes\' inside backticks`'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace newlines', ct => {
  const src = 'HELLO="expand\nnew\nlines"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace unquoted newlines to best ability', ct => {
  const src = 'HELLO=dontexpand\nnewlines'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, `HELLO='Universe'
newlines`)

  ct.end()
})

t.test('#replace inline comments', ct => {
  const src = 'HELLO=inline comments # work #very #well'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\' # work #very #well')

  ct.end()
})

t.test('#replace inline comments', ct => {
  const src = 'HELLO=inline comments # work #very #well'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\' # work #very #well') // make a little smarter to handle the spaces

  ct.end()
})

t.test('#replace hashtag in quotes', ct => {
  const src = 'HELLO="hash #tag quoted"'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace equal signs', ct => {
  const src = 'HELLO=equals=='

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace inner quotes', ct => {
  const src = 'HELLO={"foo": "bar"}'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace inner quotes as string', ct => {
  const src = 'HELLO=\'{"foo": "bar"}\''

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace inner quotes as backticks', ct => {
  const src = 'HELLO=`{"foo": "bar\'s"}`'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace spaced key', ct => {
  const src = '     HELLO=parsed'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, '     HELLO=\'Universe\'')

  ct.end()
})

t.test('#replace somewhere in the middle', ct => {
  const src = `HELLO=world
HELLO2=world
HELLO3=world
HELLO4=world`

  const newSrc = replace(src, 'HELLO2', 'universe')

  const expected = `HELLO=world
HELLO2='universe'
HELLO3=world
HELLO4=world`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#replace somewhere in the middle when double quoted', ct => {
  const src = `HELLO="world"
HELLO2="world"
HELLO3="world"
HELLO4="world"`

  const newSrc = replace(src, 'HELLO3', 'universe')

  const expected = `HELLO="world"
HELLO2="world"
HELLO3='universe'
HELLO4="world"`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#replace somewhere in the middle when single quoted', ct => {
  const src = `HELLO='world'
HELLO2='world'
HELLO3='world'
HELLO4='world'`

  const newSrc = replace(src, 'HELLO3', 'universe')

  const expected = `HELLO='world'
HELLO2='world'
HELLO3='universe'
HELLO4='world'`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#replace somewhere in the middle when backtick quoted', ct => {
  const src = `HELLO=\`world\`
HELLO2=\`world\`
HELLO3=\`world\`
HELLO4=\`world\``

  const newSrc = replace(src, 'HELLO3', 'universe')

  const expected = `HELLO=\`world\`
HELLO2=\`world\`
HELLO3='universe'
HELLO4=\`world\``

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#replace with export', ct => {
  const src = 'export HELLO=World'

  const newSrc = replace(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'export HELLO=\'Universe\'')

  ct.end()
})
