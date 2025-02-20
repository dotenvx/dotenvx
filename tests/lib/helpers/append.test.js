const t = require('tap')
const { parse } = require('../../../src/lib/main')

const append = require('../../../src/lib/helpers/append')

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
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

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
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected + '\nDOESNOTEXIST="ttt"')
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
ESCAPED2='test\\test'
GROUP='$1$2'


`

  const newSrc = append(src, 'DOESNOTEXIST', 'ttt')
  ct.same(newSrc, expected.trim() + '\nDOESNOTEXIST="ttt"')
  ct.same(parse(newSrc).DOESNOTEXIST, 'ttt')
  ct.end()
})

t.test('HELLO', ct => {
  const expected = `HELLO=a,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'HELLO', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).HELLO, 'a,ttt')
  ct.end()
})

t.test('#SPACER', ct => {
  const expected = `HELLO=a
SPACER=b,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'SPACER', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACER, 'b,ttt')
  ct.end()
})

t.test('#SPACEL', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL=c,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'SPACEL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACEL, 'c,ttt')
  ct.end()
})

t.test('#SPACEB', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB=d,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'SPACEB', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SPACEB, 'd,ttt')
  ct.end()
})

t.test('#SINGLE', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e,ttt'
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'SINGLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).SINGLE, 'e,ttt')
  ct.end()
})

t.test('#DOUBLE', ct => {
  const expected = `HELLO=a
SPACER= b
SPACEL =c
SPACEB = d
SINGLE='e'
DOUBLE="f,ttt"
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'DOUBLE', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).DOUBLE, 'f,ttt')
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
JSON={"hi": 1},{"other": 2}
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'JSON', '{"other": 2}')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).JSON, '{"hi": 1},{"other": 2}')
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
JSON2="{"hi": 1},{"hi": 2}"
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'JSON2', '{"hi": 2}')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).JSON2, '{"hi": 1},{"hi": 2}')
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
QUOTE="',""
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'QUOTE', '"')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).QUOTE, '\',"')
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
QUOTE2='",''
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'QUOTE2', "'")
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).QUOTE2, "\",'")
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
export EXPORT=k,ttt
EXPORT2='export EXPORT=k'
export EXPORT=k,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'EXPORT', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EXPORT, 'k,ttt')
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
  PAD=l,ttt
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'PAD', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).PAD, 'l,ttt')
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
BAD=f'bar,f"bar
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'BAD', 'f"bar')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).BAD, 'f\'bar,f"bar')
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
BAD2=f"bar,f'bar
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'BAD2', "f'bar")
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).BAD2, 'f"bar,f\'bar')
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
MULTI='-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,ttt'
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
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'MULTI', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI, `-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,ttt`)
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
MULTI2="-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,hi
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
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'MULTI2', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI2, `-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,hi
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
MULTI3=\`-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,hi
my
friend\`
EVAL=$(echo world)
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'MULTI3', `hi
my
friend`)
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).MULTI3, `-----BEGIN RSA PRIVATE KEY-----
ABCD
-----END RSA PRIVATE KEY-----,hi
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
EVAL=$(echo world),ttt
EMPTY=
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'EVAL', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EVAL, 'world,ttt')
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
EMPTY=,ttt
NEWLINES="expand\nnew\nlines"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'EMPTY', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).EMPTY, ',ttt')
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
NEWLINES="expand\nnew\nlines,ttt"
COMMENT=g # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'NEWLINES', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).NEWLINES, 'expand\nnew\nlines,ttt')
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
COMMENT=g,ttt # comment
HASHTAG="h #tag"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'COMMENT', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).COMMENT, 'g,ttt')
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
HASHTAG="h #tag,ttt"
D.O.T.S=i
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'HASHTAG', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).HASHTAG, 'h #tag,ttt')
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
D.O.T.S=i,ttt
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'D.O.T.S', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc)['D.O.T.S'], 'i,ttt')
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
DONT_CHOKE1='.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!,ttt'
ESCAPED=\`ESCAPED
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'DONT_CHOKE1', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).DONT_CHOKE1, '.kZh\`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!,ttt')
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
ESCAPED=\`ESCAPED,ttt
ESCAPED2='test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'ESCAPED', 'ttt')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).ESCAPED, '`ESCAPED,ttt')
  ct.end()
})

t.test('#ESCAPED2 replacing itself', ct => {
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
ESCAPED2='test\\test,test\\test\\test\\test'
GROUP='$1$2'`

  const newSrc = append(src, 'ESCAPED2', 'test\\test\\test\\test')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).ESCAPED2, 'test\\test,test\\test\\test\\test')
  ct.end()
})

t.test('#GROUP', ct => {
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
ESCAPED2='test\\test'
GROUP='$1$2,$bar$baz$paz$1234'`

  const newSrc = append(src, 'GROUP', '$bar$baz$paz$1234')
  ct.same(newSrc, expected)
  ct.same(parse(newSrc).GROUP, '$1$2,$bar$baz$paz$1234')
  ct.end()
})

t.test('#append', ct => {
  const src = 'HELLO=World'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=World,Universe')

  ct.end()
})

t.test('#append with single quotes', ct => {
  const src = 'HELLO=\'World\''

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'World,Universe\'')

  ct.end()
})

t.test('#append with double quotes', ct => {
  const src = 'HELLO="World"'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="World,Universe"')

  ct.end()
})

t.test('#append appends when key does not yet exist', ct => {
  const src = 'HELLO=World'

  const newSrc = append(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY="1234"')

  ct.end()
})

t.test('#append appends smartly if ending newline already', ct => {
  const src = 'HELLO=World\n'

  const newSrc = append(src, 'API_KEY', '1234')
  ct.same(newSrc, 'HELLO=World\nAPI_KEY="1234"\n')

  ct.end()
})

t.test('#append with double quoted multiline', ct => {
  const src = `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----"`

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, `HELLO="-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----,Universe"`)

  ct.end()
})

t.test('#append with single quoted multiline', ct => {
  const src = `HELLO='-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----'`

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, `HELLO='-----BEGIN RSA PRIVATE KEY-----
ABCD
EFGH
JKLM
-----END RSA PRIVATE KEY-----,Universe'`)

  ct.end()
})

t.test('#append with backtick quoted multiline', ct => {
  const src = `HELLO=\`-----BEGIN RSA PRIVATE KEY-----
THIS
IS
"MULTILINE's"
-----END RSA PRIVATE KEY-----\``

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, `HELLO=\`-----BEGIN RSA PRIVATE KEY-----
THIS
IS
"MULTILINE's"
-----END RSA PRIVATE KEY-----,Universe\``)

  ct.end()
})

t.test('#append evals', ct => {
  const src = 'HELLO="$(echo world)"'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="$(echo world),Universe"')

  ct.end()
})

t.test('#append empty', ct => {
  const src = 'HELLO='

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=,Universe')

  ct.end()
})

t.test('#append empty backticks', ct => {
  const src = 'HELLO=``'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=`,Universe`')

  ct.end()
})

t.test('#append spaced single quotes', ct => {
  const src = 'HELLO=\'    single quote   \''

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'    single quote   ,Universe\'')

  ct.end()
})

t.test('#append spaced double quotes', ct => {
  const src = 'HELLO="    single quote   "'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="    single quote   ,Universe"')

  ct.end()
})

t.test('#append double quotes inside single quotes', ct => {
  const src = 'HELLO=\'double "quotes" inside single quotes\''

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'double "quotes" inside single quotes,Universe\'')

  ct.end()
})

t.test('#append single quotes inside double quotes', ct => {
  const src = 'HELLO="single \'quotes\' inside single quotes"'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="single \'quotes\' inside single quotes,Universe"')

  ct.end()
})

t.test('#append double quotes and single quotes inside backticks', ct => {
  const src = 'HELLO=`double "quotes" and single \'quotes\' inside backticks`'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=`double "quotes" and single \'quotes\' inside backticks,Universe`')

  ct.end()
})

t.test('#append newlines', ct => {
  const src = 'HELLO="expand\nnew\nlines"'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="expand\nnew\nlines,Universe"')

  ct.end()
})

t.test('#append inline comments', ct => {
  const src = 'HELLO=inline comments # work #very #well'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=inline comments,Universe # work #very #well')

  ct.end()
})

t.test('#append hashtag in quotes', ct => {
  const src = 'HELLO="hash #tag quoted"'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO="hash #tag quoted,Universe"')

  ct.end()
})

t.test('#append equal signs', ct => {
  const src = 'HELLO=equals=='

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=equals==,Universe')

  ct.end()
})

t.test('#append inner quotes', ct => {
  const src = 'HELLO={"foo": "bar"}'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO={"foo": "bar"},Universe')

  ct.end()
})

t.test('#append inner quotes as string', ct => {
  const src = 'HELLO=\'{"foo": "bar"}\''

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=\'{"foo": "bar"},Universe\'')

  ct.end()
})

t.test('#append inner quotes as backticks', ct => {
  const src = 'HELLO=`{"foo": "bar\'s"}`'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'HELLO=`{"foo": "bar\'s"},Universe`')

  ct.end()
})

t.test('#append spaced key', ct => {
  const src = '     HELLO=parsed'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, '     HELLO=parsed,Universe')

  ct.end()
})

t.test('#append somewhere in the middle', ct => {
  const src = `HELLO=world
HELLO2=world
HELLO3=world
HELLO4=world`

  const newSrc = append(src, 'HELLO2', 'universe')

  const expected = `HELLO=world
HELLO2=world,universe
HELLO3=world
HELLO4=world`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#append somewhere in the middle when double quoted', ct => {
  const src = `HELLO="world"
HELLO2="world"
HELLO3="world"
HELLO4="world"`

  const newSrc = append(src, 'HELLO3', 'universe')

  const expected = `HELLO="world"
HELLO2="world"
HELLO3="world,universe"
HELLO4="world"`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#append somewhere in the middle when single quoted', ct => {
  const src = `HELLO='world'
HELLO2='world'
HELLO3='world'
HELLO4='world'`

  const newSrc = append(src, 'HELLO3', 'universe')

  const expected = `HELLO='world'
HELLO2='world'
HELLO3='world,universe'
HELLO4='world'`

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#append somewhere in the middle when backtick quoted', ct => {
  const src = `HELLO=\`world\`
HELLO2=\`world\`
HELLO3=\`world\`
HELLO4=\`world\``

  const newSrc = append(src, 'HELLO3', 'universe')

  const expected = `HELLO=\`world\`
HELLO2=\`world\`
HELLO3=\`world,universe\`
HELLO4=\`world\``

  ct.same(newSrc, expected)

  ct.end()
})

t.test('#append with export', ct => {
  const src = 'export HELLO=World'

  const newSrc = append(src, 'HELLO', 'Universe')
  ct.same(newSrc, 'export HELLO=World,Universe')

  ct.end()
})
