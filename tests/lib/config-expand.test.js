const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('expands', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC, 'basic')

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC_EXPAND, 'basic')

  ct.equal(env.parsed.MACHINE_EXPAND, 'file')
  ct.equal(process.env.MACHINE_EXPAND, 'file')

  ct.end()
})

t.test('expands using the machine value first (if it exists)', ct => {
  process.env.MACHINE = 'machine'

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.MACHINE, 'machine')
  ct.equal(env.parsed.MACHINE_EXPAND, 'machine')
  ct.equal(process.env.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('expands to bring own processEnv', ct => {
  const myObject = {}

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath, processEnv: myObject })

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(myObject.BASIC, 'basic')
  ct.equal(process.env.BASIC, undefined)

  ct.equal(env.parsed.BASIC, 'basic')
  ct.equal(process.env.BASIC_EXPAND, undefined)
  ct.equal(myObject.BASIC_EXPAND, 'basic')

  ct.equal(env.parsed.MACHINE_EXPAND, 'file')
  ct.equal(process.env.MACHINE_EXPAND, undefined)
  ct.equal(myObject.MACHINE_EXPAND, 'file')

  ct.end()
})

t.test('expands .env.expand correctly', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.ESCAPED_EXPAND, '$ESCAPED')
  ct.equal(process.env.ESCAPED_EXPAND, '$ESCAPED')

  ct.equal(env.parsed.EXPAND_DEFAULT, 'file')
  ct.equal(process.env.EXPAND_DEFAULT, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED2, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED2, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE2, 'filedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE2, 'filedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'file')

  ct.equal(env.parsed.UNDEFINED_EXPAND, '')
  ct.equal(process.env.UNDEFINED_EXPAND, '')

  ct.equal(env.parsed.UNDEFINED_EXPAND_NESTED, 'file')
  ct.equal(process.env.UNDEFINED_EXPAND_NESTED, 'file')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2, '/default/path:with/colon')

  ct.equal(env.parsed.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, ':-/default/path:with/colon')
  ct.equal(process.env.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, ':-/default/path:with/colon')

  ct.equal(env.parsed.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '-/default/path:with/colon')
  ct.equal(process.env.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '-/default/path:with/colon')

  ct.end()
})

t.test('expands .env.expand correctly when MACHINE already set', ct => {
  process.env.MACHINE = 'machine'

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.ESCAPED_EXPAND, '$ESCAPED')
  ct.equal(process.env.ESCAPED_EXPAND, '$ESCAPED')

  ct.equal(env.parsed.EXPAND_DEFAULT, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT, 'machine')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED, 'machine')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED2, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED2, 'machine')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE, 'machinedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE, 'machinedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE2, 'machinedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE2, 'machinedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'machine')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'machine')

  ct.equal(env.parsed.UNDEFINED_EXPAND, '')
  ct.equal(process.env.UNDEFINED_EXPAND, '')

  ct.equal(env.parsed.UNDEFINED_EXPAND_NESTED, 'machine')
  ct.equal(process.env.UNDEFINED_EXPAND_NESTED, 'machine')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2, 'default')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2, 'default')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED, '/default/path:with/colon')

  ct.equal(env.parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2, '/default/path:with/colon')
  ct.equal(process.env.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2, '/default/path:with/colon')

  ct.end()
})

t.test('expands .env.expand correctly when MACHINE already set but overload is true', ct => {
  process.env.MACHINE = 'machine'

  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath, overload: true })

  ct.equal(env.parsed.MACHINE, 'file')
  ct.equal(env.parsed.MACHINE_EXPAND, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT, 'file')
  ct.equal(process.env.EXPAND_DEFAULT, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED2, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED2, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_NESTED_TWICE2, 'filedefault')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED_TWICE2, 'filedefault')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'file')

  ct.equal(env.parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'file')
  ct.equal(process.env.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'file')

  ct.equal(env.parsed.UNDEFINED_EXPAND, '')
  ct.equal(process.env.UNDEFINED_EXPAND, '')

  ct.equal(env.parsed.UNDEFINED_EXPAND_NESTED, 'file')
  ct.equal(process.env.UNDEFINED_EXPAND_NESTED, 'file')

  ct.end()
})

t.test('expands mongo (real world example)', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.MONGOLAB_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')
  ct.equal(env.parsed.MONGOLAB_URI_RECURSIVELY, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')
  ct.equal(env.parsed.NO_CURLY_BRACES_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')
  ct.equal(env.parsed.NO_CURLY_BRACES_URI_RECURSIVELY, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})

t.test('expands with periods in key name', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed['POSTGRESQL.MAIN.USER'], 'postgres')

  ct.end()
})

t.test('does not expand dollar ($)', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.DOLLAR, '$')

  ct.end()
})

t.test('handles $one$two', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.ONETWO, 'onetwo')
  ct.equal(env.parsed.ONETWO_SIMPLE, 'onetwo')
  ct.equal(env.parsed.ONETWO_SIMPLE2, 'onetwo')
  ct.equal(env.parsed.ONETWO_SUPER_SIMPLE, 'onetwo')

  ct.end()
})

t.test('handles two dollar signs', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.TWO_DOLLAR_SIGNS, 'abcd$$1234')

  ct.end()
})

t.test('does not choke', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.DONT_CHOKE1, '.kZh`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!')
  ct.equal(env.parsed.DONT_CHOKE2, '=;+=CNy3)-D=zI6gRP2w\\$B@0K;Y]e^EFnCmx\\$Dx?;.9wf-rgk1BcTR0]JtY<S:b_')
  ct.equal(env.parsed.DONT_CHOKE3, 'MUcKSGSY@HCON<1S_siWTP`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms`D8E2H')
  ct.equal(env.parsed.DONT_CHOKE4, 'm]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer`*noVaI<vqa3?FZ9+6U;K#Bfd')
  ct.equal(env.parsed.DONT_CHOKE5, '#la__nK?IxNlQ%`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y`A8m=Oa-B!)')
  ct.equal(env.parsed.DONT_CHOKE6, 'xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1\\$(W{:Wc}Q')
  ct.equal(env.parsed.DONT_CHOKE7, '?\\$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z\\$/UDm8o79n/p%')
  ct.equal(env.parsed.DONT_CHOKE8, '@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F`G<!Ks7]kbS]N1:bP:')

  ct.end()
})

t.test('expands DOMAIN with $HOST', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.HOST, 'something')
  ct.equal(env.parsed.DOMAIN, 'https://something')

  ct.end()
})

t.test('does NOT expand SINGLE_QUOTE', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.SINGLE_QUOTE, '$BASIC')

  ct.end()
})

t.test('handles deep nesting', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.DEEP8, 'prefix5-prefix4-prefix3-prefix2-prefix1-basic-suffix1-suffix2-suffix3-suffix4-suffix5')

  ct.end()
})

t.test('handles self referencing', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.EXPAND_SELF, '')
  ct.equal(env.parsed.DEEP_SELF, 'basic-bar')
  ct.equal(env.parsed.DEEP_SELF_PRIOR, 'prefix2-foo-suffix2')

  ct.end()
})

t.test('handles progressive updating', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  ct.equal(env.parsed.PROGRESSIVE, 'first-second')

  ct.end()
})

t.test('single quote expansion bug test cases', ct => {
  const testPath = 'tests/.env.expand'
  const env = dotenvx.config({ path: testPath })

  // Case 1: Should work - first variable in single quotes
  ct.equal(env.parsed.PGUSER, 'user', 'PGUSER should be user')
  ct.equal(env.parsed.PGHOST, 'localhost', 'PGHOST should be localhost')
  ct.equal(env.parsed.DATABASE_URL, 'postgres://user@localhost/my_database', 'DATABASE_URL should expand both variables')

  // Case 2: Should work - first variable in single quotes, second in double quotes
  ct.equal(env.parsed.PGUSER2, 'user', 'PGUSER2 should be user')
  ct.equal(env.parsed.PGHOST2, 'localhost', 'PGHOST2 should be localhost')
  ct.equal(env.parsed.DATABASE_URL2, 'postgres://user@localhost/my_database', 'DATABASE_URL2 should expand both variables')

  // Case 3: Should work - first variable in double quotes
  ct.equal(env.parsed.PGUSER3, 'user', 'PGUSER3 should be user')
  ct.equal(env.parsed.PGHOST3, 'localhost', 'PGHOST3 should be localhost')
  ct.equal(env.parsed.DATABASE_URL3, 'postgres://user@localhost/my_database', 'DATABASE_URL3 should expand both variables')

  // Case 4: Should work - both variables in single quotes
  ct.equal(env.parsed.PGUSER4, 'user', 'PGUSER4 should be user')
  ct.equal(env.parsed.PGHOST4, 'localhost', 'PGHOST4 should be localhost')
  ct.equal(env.parsed.DATABASE_URL4, 'postgres://user@localhost/my_database', 'DATABASE_URL4 should expand both variables')

  // Case 5: Should work - both variables in double quotes
  ct.equal(env.parsed.PGUSER5, 'user', 'PGUSER5 should be user')
  ct.equal(env.parsed.PGHOST5, 'localhost', 'PGHOST5 should be localhost')
  ct.equal(env.parsed.DATABASE_URL5, 'postgres://user@localhost/my_database', 'DATABASE_URL5 should expand both variables')

  ct.end()
})
