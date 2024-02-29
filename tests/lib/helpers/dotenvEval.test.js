const t = require('tap')

const dotenvEval = require('../../../src/lib/helpers/dotenvEval')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#eval', ct => {
  const options = {
    parsed: {
      HELLO: '$(echo World)'
    }
  }
  const parsed = dotenvEval.eval(options).parsed

  ct.same(parsed.HELLO, 'World')
  ct.same(process.env.HELLO, 'World')

  ct.end()
})

t.test('#eval more complicated', ct => {
  const options = {
    parsed: {
      DATABASE_URL: 'postgres://$(echo username)@localhost/my_database'
    }
  }
  const parsed = dotenvEval.eval(options).parsed

  ct.same(parsed.DATABASE_URL, 'postgres://username@localhost/my_database')
  ct.same(process.env.DATABASE_URL, 'postgres://username@localhost/my_database')

  ct.end()
})

t.test('#eval (already set on machine then do not eval)', ct => {
  process.env.HELLO = '$(echo machine)'
  const options = {
    parsed: {
      HELLO: '$(echo World)'
    }
  }
  const parsed = dotenvEval.eval(options).parsed

  ct.same(parsed.HELLO, '$(echo machine)')
  ct.same(process.env.HELLO, '$(echo machine)')

  ct.end()
})

t.test('#eval (already set on machine but matches exactly parsed so do eval)', ct => {
  process.env.HELLO = '$(echo World)'
  const options = {
    parsed: {
      HELLO: '$(echo World)'
    }
  }
  const parsed = dotenvEval.eval(options).parsed

  ct.same(parsed.HELLO, 'World')
  ct.same(process.env.HELLO, 'World')

  ct.end()
})
