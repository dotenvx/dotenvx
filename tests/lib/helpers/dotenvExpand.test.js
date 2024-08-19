const t = require('tap')

const dotenvExpand = require('../../../src/lib/helpers/dotenvExpand')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#expand', ct => {
  const options = {
    parsed: {
      BASIC: 'basic',
      BASIC_EXPAND: '$BASIC'
    }
  }
  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.BASIC, 'basic')
  ct.same(processEnv.BASIC, undefined)
  ct.same(process.env.BASIC, undefined)

  ct.same(parsed.BASIC_EXPAND, 'basic')
  ct.same(processEnv.BASIC_EXPAND, 'basic')
  ct.same(process.env.BASIC_EXPAND, undefined) // it should not update process.env directly

  ct.end()
})

t.test('#expand using the machine value first (if it exists)', ct => {
  process.env.MACHINE = 'machine'
  const options = {
    parsed: {
      MACHINE: 'file',
      MACHINE_EXPAND: '$MACHINE'
    },
    processEnv: process.env
  }
  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.MACHINE, 'file')
  ct.same(processEnv.MACHINE, 'machine')
  ct.same(process.env.MACHINE, 'machine')

  ct.same(parsed.MACHINE_EXPAND, 'file')
  ct.same(processEnv.MACHINE_EXPAND, 'machine')
  ct.same(process.env.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('#expand using the machine value first (if it exists) but where the expansion key is also already set on process.env', ct => {
  process.env.MACHINE = 'machine'
  process.env.MACHINE_EXPAND = 'already set!'
  const options = {
    parsed: {
      MACHINE: 'file',
      MACHINE_EXPAND: '$MACHINE'
    },
    processEnv: process.env
  }
  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.MACHINE, 'file')
  ct.same(processEnv.MACHINE, 'machine')
  ct.same(process.env.MACHINE, 'machine')

  ct.same(parsed.MACHINE_EXPAND, 'file')
  ct.same(processEnv.MACHINE_EXPAND, 'already set!')
  ct.same(process.env.MACHINE_EXPAND, 'already set!')

  ct.end()
})

t.test('#expand with nothing to expand', ct => {
  const options = {
    processEnv: {
      HELLO: 'machine'
    },
    parsed: {
      HELLO: 'World'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.HELLO, 'World')
  ct.same(processEnv.HELLO, 'machine')

  ct.end()
})

t.test('#expand with falsey value should not change that', ct => {
  const options = {
    processEnv: {
      BASIC: ''
    },
    parsed: {
      BASIC: 'basic'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.BASIC, 'basic')
  ct.same(processEnv.BASIC, '')

  ct.end()
})

t.test('#expand simple and typical (present of value in .env but not process.env)', ct => {
  const options = {
    processEnv: {},
    parsed: {
      HELLO: 'frontend'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.HELLO, 'frontend')
  ct.same(processEnv.HELLO, undefined)
  ct.same(process.env.HELLO, undefined)

  ct.end()
})

t.test('does not expand escaped variables', ct => {
  const options = {
    processEnv: {},
    parsed: {
      ESCAPED_EXPAND: '\\$ESCAPED'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.ESCAPED_EXPAND, '$ESCAPED')
  ct.same(processEnv.ESCAPED_EXPAND, undefined)
  ct.same(process.env.ESCAPED_EXPAND, undefined)

  ct.end()
})

t.test('handles expand with default', ct => {
  const options = {
    processEnv: {},
    parsed: {
      MACHINE: 'file',
      // eslint-disable-next-line no-template-curly-in-string
      EXPAND_DEFAULT: '${MACHINE:-default}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.EXPAND_DEFAULT, 'file')
  ct.same(processEnv.EXPAND_DEFAULT, 'file')

  ct.end()
})

t.test('handles expand with default - when machine has a set value already', ct => {
  const options = {
    processEnv: {
      MACHINE: 'already set'
    },
    parsed: {
      MACHINE: 'file',
      // eslint-disable-next-line no-template-curly-in-string
      EXPAND_DEFAULT: '${MACHINE:-default}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.EXPAND_DEFAULT, 'file')
  ct.same(processEnv.EXPAND_DEFAULT, 'already set')

  ct.end()
})

t.test('handles multi-nested with defaults', ct => {
  const options = {
    processEnv: {},
    parsed: {
      MACHINE: 'file',
      // eslint-disable-next-line no-template-curly-in-string
      EXPAND_DEFAULT_NESTED_TWICE: '${UNDEFINED:-${MACHINE}${UNDEFINED:-default}}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')
  ct.same(processEnv.EXPAND_DEFAULT_NESTED_TWICE, 'filedefault')

  ct.end()
})

t.test('handles mongolab example', ct => {
  const options = {
    processEnv: {},
    parsed: {
      MONGOLAB_DATABASE: 'heroku_db',
      MONGOLAB_USER: 'username',
      MONGOLAB_PASSWORD: 'password',
      MONGOLAB_DOMAIN: 'abcd1234.mongolab.com',
      MONGOLAB_PORT: '12345',
      // eslint-disable-next-line no-template-curly-in-string
      MONGOLAB_URI: 'mongodb://${MONGOLAB_USER}:${MONGOLAB_PASSWORD}@${MONGOLAB_DOMAIN}:${MONGOLAB_PORT}/${MONGOLAB_DATABASE}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.MONGOLAB_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')
  ct.same(processEnv.MONGOLAB_URI, 'mongodb://username:password@abcd1234.mongolab.com:12345/heroku_db')

  ct.end()
})
