const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Run = require('../../../src/lib/services/run')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run().run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    errors: [exampleError]
  }])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').throws(new Error('Mock Error'))

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    errors: [exampleError]
  }])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, [])

  readFileSyncStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: null,
    src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (encrypted .env finds .env.keys next to itself)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/encrypted/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1',
    src: fs.readFileSync('tests/monorepo/apps/encrypted/.env').toString(),
    parsed: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted'
    },
    injected: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/encrypted/.env'])
  ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

  ct.end()
})

t.test('#run (encrypted .env with bad private key)', ct => {
  process.env.DOTENV_PRIVATE_KEY = 'bad-private-key'

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/encrypted/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  const error = new Error('[INVALID_PRIVATE_KEY] could not decrypt HELLO using private key \'DOTENV_PRIVATE_KEY=bad-pri…\'')
  error.code = 'INVALID_PRIVATE_KEY'
  error.help = '[INVALID_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/465'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/encrypted/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: 'bad-private-key',
    src: fs.readFileSync('tests/monorepo/apps/encrypted/.env').toString(),
    parsed: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=='
    },
    errors: [error],
    injected: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted:BG8M6U+GKJGwpGA42ml2erb9+T2NBX6Z2JkBLynDy21poz0UfF5aPxCgRbIyhnQFdWKd0C9GZ7lM5PeL86xghoMcWvvPpkyQ0yaD2pZ64RzoxFGB1lTZYlEgQOxTDJnWxODHfuQcFY10uA=='
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/encrypted/.env'])
  ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

  ct.end()
})

t.test('#run when DOTENV_PRIVATE_KEY set but envs is not set', ct => {
  const originalDirectory = process.cwd()

  process.env.DOTENV_PRIVATE_KEY = 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1'

  // change to the tests/monorepo/apps/encrypted directory to simulate correctly
  process.chdir('tests/monorepo/apps/encrypted')

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run().run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1',
    src: fs.readFileSync('.env').toString(),
    parsed: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted'
    },
    injected: {
      DOTENV_PUBLIC_KEY: '03eaf2142ab3d55bdf108962334e06696db798e7412cfc51d75e74b4f87f299bba',
      HELLO: 'encrypted'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['.env'])
  ct.same(uniqueInjectedKeys, ['DOTENV_PUBLIC_KEY', 'HELLO'])

  process.chdir(originalDirectory)

  ct.end()
})

t.test('#run (finds .env file) with already falsy value', ct => {
  process.env.HELLO = '' // falsy value

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: null,
    src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
    parsed: {
      HELLO: ''
    },
    injected: {},
    errors: [],
    preExisted: {
      HELLO: ''
    }
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: null,
    src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (finds .env file but HELLO already exists)', ct => {
  process.env.HELLO = 'World'

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: null,
    src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
    parsed: {
      HELLO: 'World'
    },
    injected: {},
    errors: [],
    preExisted: {
      HELLO: 'World'
    }
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, [])

  ct.end()
})

t.test('#run (finds .env file but HELLO already exists but overload is on)', ct => {
  process.env.HELLO = 'World'

  const envs = [
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs, true).run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    privateKeyName: 'DOTENV_PRIVATE_KEY',
    privateKey: null,
    src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (command substitution)', ct => {
  const envs = [
    { type: 'envFile', value: 'tests/.env.eval' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/.env.eval',
    privateKeyName: 'DOTENV_PRIVATE_KEY_EVAL',
    privateKey: null,
    src: fs.readFileSync('tests/.env.eval').toString(),
    parsed: {
      HELLO: 'world'
    },
    injected: {
      HELLO: 'world'
    },
    errors: [],
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/.env.eval'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (with envs as string)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]

  // it should still prepend a type 'envFile': value: '.env'
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'
  ct.same(processedEnvs, [
    {
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    },
    {
      type: 'env',
      string: 'HELLO=string',
      parsed: {
        HELLO: 'string'
      },
      injected: {
        HELLO: 'string'
      },
      errors: [],
      preExisted: {}
    }
  ])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (with envs as string and errors somehow from inject)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'
  const run = new Run(envs)
  const mockError = new Error('Mock Error')
  const injectStub = sinon.stub(run, 'inject').throws(mockError)

  const {
    processedEnvs
  } = run.run()

  ct.same(processedEnvs, [
    {
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    },
    {
      type: 'env',
      string: 'HELLO=string',
      errors: [mockError],
      parsed: {
        HELLO: 'string'
      },
      injected: {
        HELLO: 'string'
      },
      preExisted: {}
    }
  ])

  injectStub.restore()

  ct.end()
})

t.test('#run (mixed string and file)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' },
    { type: 'envFile', value: 'tests/monorepo/apps/frontend/.env' }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  ct.same(processedEnvs, [
    {
      type: 'env',
      string: 'HELLO=string',
      parsed: { HELLO: 'string' },
      injected: { HELLO: 'string' },
      errors: [],
      preExisted: {}
    },
    {
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: null,
      src: fs.readFileSync('tests/monorepo/apps/frontend/.env').toString(),
      parsed: { HELLO: 'string' },
      injected: {},
      errors: [],
      preExisted: { HELLO: 'string' }
    }
  ])

  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

// https://github.com/dotenvx/dotenvx/issues/441
t.test('#run (kanaka scenario)', ct => {
  const src = `# combined
# config1 definitions
options="$\{options} optA"
configX=blah
# config2 definitions
options="$\{options} optB optC $\{configX:+optX}"
# config3 definitions
options="$\{options} optD"`
  const envs = [
    { type: 'env', value: src }
  ]

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new Run(envs).run()

  const exampleError = new Error(`[MISSING_ENV_FILE] missing .env file (${path.resolve('.env')})`)
  exampleError.help = '[MISSING_ENV_FILE] https://github.com/dotenvx/dotenvx/issues/484'
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [
    {
      type: 'envFile',
      filepath: '.env',
      errors: [exampleError]
    },
    {
      type: 'env',
      string: src,
      parsed: { options: ' optA optB optC optX optD', configX: 'blah' },
      errors: [],
      injected: { options: ' optA optB optC optX optD', configX: 'blah' },
      preExisted: {}
    }
  ])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, ['options', 'configX'])

  ct.end()
})
