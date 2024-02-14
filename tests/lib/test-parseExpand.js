const fs = require('fs')
const t = require('tap')

const dotenvx = require('../../src/lib/main')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('returns object', ct => {
  const dotenv = { parsed: {} }
  const parsed = dotenvx.parseExpand(dotenv)

  t.ok(parsed instanceof Object, 'should be an object')

  ct.end()
})

t.test('expands environment variables', ct => {
  const dotenv = {
    parsed: {
      BASIC: 'basic',
      BASIC_EXPAND: '${BASIC}',
      BASIC_EXPAND_SIMPLE: '$BASIC'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.BASIC_EXPAND, 'basic')
  ct.equal(parsed.BASIC_EXPAND_SIMPLE, 'basic')

  ct.end()
})

t.test('uses environment variables existing already on the machine for expansion', ct => {
  process.env.MACHINE = 'machine'
  const dotenv = {
    parsed: {
      MACHINE_EXPAND: '${MACHINE}',
      MACHINE_EXPAND_SIMPLE: '$MACHINE'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MACHINE_EXPAND, 'machine')
  ct.equal(parsed.MACHINE_EXPAND_SIMPLE, 'machine')

  ct.end()
})

t.test('does not expand environment variables existing already on the machine that look like they could expand', ct => {
  process.env.PASSWORD = 'pas$word'
  const dotenv = {
    parsed: {
      PASSWORD: 'dude',
      PASSWORD_EXPAND: '${PASSWORD}',
      PASSWORD_EXPAND_SIMPLE: '$PASSWORD'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.PASSWORD_EXPAND, 'pas$word')
  ct.equal(parsed.PASSWORD_EXPAND_SIMPLE, 'pas$word')
  ct.equal(parsed.PASSWORD, 'pas$word')

  ct.end()
})

t.test('expands missing environment variables to an empty string', ct => {
  const dotenv = {
    parsed: {
      UNDEFINED_EXPAND: '$UNDEFINED'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND, '')

  ct.end()
})

t.test('prioritizes machine key expansion over .env', ct => {
  process.env.MACHINE = 'machine'
  const dotenv = {
    parsed: {
      MACHINE: 'machine_env',
      MACHINE_EXPAND: '$MACHINE'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('does not expand escaped variables', ct => {
  const dotenv = {
    parsed: {
      ESCAPED_EXPAND: '\\$ESCAPED'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.ESCAPED_EXPAND, '$ESCAPED')

  ct.end()
})

t.test('does not expand inline escaped dollar sign', ct => {
  const dotenv = {
    parsed: {
      INLINE_ESCAPED_EXPAND: 'pa\\$\\$word'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.INLINE_ESCAPED_EXPAND, 'pa$$word')

  ct.end()
})

t.test('does not overwrite preset variables', ct => {
  process.env.SOME_ENV = 'production'
  const dotenv = {
    parsed: {
      SOME_ENV: 'development'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.SOME_ENV, 'production')

  ct.end()
})

t.test('does not expand inline escaped dollar sign', ct => {
  const dotenv = {
    parsed: {
      INLINE_ESCAPED_EXPAND_BCRYPT: '\\$2b\\$10\\$OMZ69gxxsmRgwAt945WHSujpr/u8ZMx.xwtxWOCMkeMW7p3XqKYca'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.INLINE_ESCAPED_EXPAND_BCRYPT, '$2b$10$OMZ69gxxsmRgwAt945WHSujpr/u8ZMx.xwtxWOCMkeMW7p3XqKYca')

  ct.end()
})

t.test('handle mixed values', ct => {
  const dotenv = {
    parsed: {
      PARAM1: '42',
      MIXED_VALUES: '\\$this$PARAM1\\$is${PARAM1}'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MIXED_VALUES, '$this42$is42')

  ct.end()
})

t.test('expands environment variables', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.BASIC_EXPAND, 'basic')

  ct.end()
})

t.test('expands environment variables (process.env)', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.BASIC_EXPAND, 'basic')

  ct.end()
})

t.test('expands environment variables existing already on the machine', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('expands environment variables existing already on the machine (process.env)', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('expands missing environment variables to an empty string', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND, '')

  ct.end()
})

t.test('expands missing environment variables to an empty string (process.env)', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND, '')

  ct.end()
})

t.test('expands environment variables existing already on the machine even with a default', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.EXPAND_DEFAULT, 'machine')

  ct.end()
})

t.test('expands environment variables existing already on the machine even with a default when nested', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.EXPAND_DEFAULT_NESTED, 'machine')
  ct.equal(process.env.EXPAND_DEFAULT_NESTED2, 'machine')

  ct.end()
})

t.test('expands environment variables undefined with one already on the machine even with a default when nested', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.UNDEFINED_EXPAND_NESTED, 'machine')

  ct.end()
})

t.test('expands missing environment variables to an empty string but replaces with default', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT, 'default')
  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT2, 'default')

  ct.end()
})

t.test('expands environent variables and concats with default nested', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.EXPAND_DEFAULT_NESTED_TWICE, 'machine_envdefault')
  ct.equal(parsed.EXPAND_DEFAULT_NESTED_TWICE2, 'machine_envdefault')

  ct.end()
})

t.test('expands environent variables and concats with default nested', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.EXPAND_DEFAULT_NESTED_TWICE, 'machine_envdefault')
  ct.equal(parsed.EXPAND_DEFAULT_NESTED_TWICE2, 'machine_envdefault')

  ct.end()
})

t.test('expands missing environment variables to an empty string but replaces with default nested', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_NESTED, 'default')
  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_NESTED2, 'default')

  ct.end()
})

t.test('expands missing environment variables to an empty string but replaces with default nested twice', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE, 'default')
  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_NESTED_TWICE2, 'default')

  ct.end()
})

t.test('prioritizes machine key expansion over .env', ct => {
  process.env.MACHINE = 'machine'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('multiple expand', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MONGOLAB_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})

t.test('should expand recursively', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.MONGOLAB_URI_RECURSIVELY, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})

t.test('multiple expand', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.NO_CURLY_BRACES_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})

t.test('should expand recursively', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.NO_CURLY_BRACES_URI_RECURSIVELY, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})

t.test('can write to an object rather than process.env if user provides it', ct => {
  const myObject = {}
  const dotenv = {
    processEnv: myObject,
    parsed: {
      SHOULD_NOT_EXIST: 'testing'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)
  const evaluation = typeof process.env.SHOULD_NOT_EXIST

  ct.equal(parsed.SHOULD_NOT_EXIST, 'testing')
  ct.equal(myObject.SHOULD_NOT_EXIST, 'testing')
  ct.equal(evaluation, 'undefined')

  ct.end()
})

t.test('expands environment variables existing already on the machine even with a default with special characters', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'machine_env')
  ct.equal(parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'machine_env')

  ct.end()
})

t.test('expands environment variables existing already on the machine even with a default with special characters (process.env)', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS, 'machine_env')
  ct.equal(parsed.EXPAND_DEFAULT_SPECIAL_CHARACTERS2, 'machine_env')

  ct.end()
})

t.test('should expand with default value correctly', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')
  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')
  ct.equal(parsed.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS, '/default/path:with/colon')
  ct.equal(parsed.NO_CURLY_BRACES_UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS2, '/default/path:with/colon')

  ct.end()
})

t.test('should expand with default nested value correctly', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED, '/default/path:with/colon')
  ct.equal(parsed.UNDEFINED_EXPAND_DEFAULT_SPECIAL_CHARACTERS_NESTED2, '/default/path:with/colon')

  ct.end()
})

t.test('should expand variables with "." in names correctly', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed['POSTGRESQL.MAIN.USER'], parsed['POSTGRESQL.BASE.USER'])

  ct.end()
})

t.test('handles value of only $', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.DOLLAR, '$')

  ct.end()
})

t.test('handles $one$two', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.ONETWO, 'onetwo')
  ct.equal(parsed.ONETWO_SIMPLE, 'onetwo')
  ct.equal(parsed.ONETWO_SIMPLE2, 'onetwo')
  ct.equal(parsed.ONETWO_SUPER_SIMPLE, 'onetwo')

  ct.end()
})

t.test('handles two dollar signs', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.TWO_DOLLAR_SIGNS, 'abcd$')

  ct.end()
})

t.test('does not choke', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.DONT_CHOKE1, '.kZh`>4[,[DDU-*Jt+[;8-,@K=,9%;F9KsoXqOE)gpG^X!{)Q+/9Fc(QF}i[NEi!')
  ct.equal(parsed.DONT_CHOKE2, '=;+=CNy3)-D=zI6gRP2w$B@0K;Y]e^EFnCmx$Dx?;.9wf-rgk1BcTR0]JtY<S:b_')
  ct.equal(parsed.DONT_CHOKE3, 'MUcKSGSY@HCON<1S_siWTP`DgS*Ug],mu]SkqI|7V2eOk9:>&fw;>HEwms`D8E2H')
  ct.equal(parsed.DONT_CHOKE4, 'm]zjzfRItw2gs[2:{p{ugENyFw9m)tH6_VCQzer`*noVaI<vqa3?FZ9+6U;K#Bfd')
  ct.equal(parsed.DONT_CHOKE5, '#la__nK?IxNlQ%`5q&DpcZ>Munx=[1-AMgAcwmPkToxTaB?kgdF5y`A8m=Oa-B!)')
  ct.equal(parsed.DONT_CHOKE6, 'xlC&*<j4J<d._<JKH0RBJV!4(ZQEN-+&!0p137<g*hdY2H4xk?/;KO1$(W{:Wc}Q')
  ct.equal(parsed.DONT_CHOKE7, '?$6)m*xhTVewc#NVVgxX%eBhJjoHYzpXFg=gzn[rWXPLj5UWj@z$/UDm8o79n/p%')
  ct.equal(parsed.DONT_CHOKE8, '@}:[4#g%[R-CFR});bY(Z[KcDQDsVn2_y4cSdU<Mjy!c^F`G<!Ks7]kbS]N1:bP:')

  ct.end()
})

t.test('expands self without a recursive call stack error', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.EXPAND_SELF, '$EXPAND_SELF') // because it ends up accessing parsed[key].

  ct.end()
})

t.test('expands DOMAIN with ${HOST}', ct => {
  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.HOST, 'something')
  ct.equal(parsed.DOMAIN, 'https://something')

  ct.end()
})

t.test('does not attempt to expand password if already existed in processEnv', ct => {
  process.env.PASSWORD = 'pas$word'

  const dotenv = fs.readFileSync('tests/.env.expand', { encoding: 'utf8' })
  dotenvx.parseExpand(dotenv)

  ct.equal(process.env.PASSWORD, 'pas$word')

  ct.end()
})

t.test('does not expand dollar sign that are not variables', ct => {
  const dotenv = {
    parsed: {
      NO_VARIABLES: '\\$.$+$-$$'
    }
  }
  const parsed = dotenvx.parseExpand(dotenv)

  ct.equal(parsed.NO_VARIABLES, '$.$+$-$$')

  ct.end()
})
