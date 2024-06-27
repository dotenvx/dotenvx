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
  ct.same(parsed.BASIC_EXPAND, 'basic')
  ct.same(processEnv.BASIC, undefined)
  ct.same(processEnv.BASIC_EXPAND, 'basic') // edge case where becuase it was an expansion we also need to place it in processEnv with its possible expansion value
  ct.same(process.env.BASIC, undefined)
  ct.same(process.env.BASIC_EXPAND, 'basic')

  ct.end()
})

t.test('#expand using the machine value first (if it exists)', ct => {
  process.env.MACHINE = 'machine'
  const options = {
    parsed: {
      MACHINE: 'file',
      MACHINE_EXPAND: '$MACHINE'
    }
  }
  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.MACHINE, 'file')
  ct.same(parsed.MACHINE_EXPAND, 'file')
  ct.same(processEnv.MACHINE, 'machine')
  ct.same(processEnv.MACHINE_EXPAND, 'machine')
  ct.same(process.env.MACHINE, 'machine')
  ct.same(process.env.MACHINE_EXPAND, 'machine')

  ct.end()
})

t.test('#expand using the machine value first (if it exists) when given a processEnv', ct => {
  const options = {
    processEnv: {
      MACHINE: 'machine'
    },
    parsed: {
      MACHINE: 'file',
      MACHINE_EXPAND: '$MACHINE'
    }
  }
  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.MACHINE, 'file')
  ct.same(parsed.MACHINE_EXPAND, 'file')
  ct.same(processEnv.MACHINE, 'machine')
  ct.same(processEnv.MACHINE_EXPAND, 'machine')

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
      MACHINE: 'machine_env',
      // eslint-disable-next-line no-template-curly-in-string
      EXPAND_DEFAULT: '${MACHINE:-default}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.EXPAND_DEFAULT, 'machine_env')
  ct.same(processEnv.EXPAND_DEFAULT, 'machine_env') // it should use the processEnv value if it exists, but otherwise use the file value since it does

  ct.end()
})

t.test('handles multi-nested with defaults', ct => {
  const options = {
    processEnv: {},
    parsed: {
      MACHINE: 'machine_env',
      // eslint-disable-next-line no-template-curly-in-string
      EXPAND_DEFAULT_NESTED_TWICE: '${UNDEFINED:-${MACHINE}${UNDEFINED:-default}}'
    }
  }

  const { parsed, processEnv } = dotenvExpand.expand(options)

  ct.same(parsed.EXPAND_DEFAULT_NESTED_TWICE, 'machine_envdefault')
  ct.same(processEnv.EXPAND_DEFAULT_NESTED_TWICE, 'machine_envdefault')

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
