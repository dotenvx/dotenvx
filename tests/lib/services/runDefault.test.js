const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const RunDefault = require('../../../src/lib/services/runDefault')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    error: exampleError
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
  } = new RunDefault().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: '.env',
    error: exampleError
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
  } = new RunDefault(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

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
  } = new RunDefault(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
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
  } = new RunDefault(envs).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {},
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
  } = new RunDefault(envs, true).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'frontend'
    },
    injected: {
      HELLO: 'frontend'
    },
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
  } = new RunDefault(envs).run()

  ct.same(processedEnvs, [{
    type: 'envFile',
    filepath: 'tests/.env.eval',
    parsed: {
      HELLO: 'world'
    },
    injected: {
      HELLO: 'world'
    },
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

  const {
    processedEnvs,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  ct.same(processedEnvs, [{
    type: 'env',
    string: 'HELLO=string',
    parsed: {
      HELLO: 'string'
    },
    injected: {
      HELLO: 'string'
    },
    preExisted: {}
  }])
  ct.same(readableFilepaths, [])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})

t.test('#run (with envs as string and errors somehow from inject)', ct => {
  const envs = [
    { type: 'env', value: 'HELLO=string' }
  ]

  const runDefault = new RunDefault(envs)
  const mockError = new Error('Mock Error')
  const injectStub = sinon.stub(runDefault, '_inject').throws(mockError)

  const {
    processedEnvs
  } = runDefault.run()

  ct.same(processedEnvs, [{
    type: 'env',
    string: 'HELLO=string',
    error: mockError,
    parsed: {
      HELLO: 'string'
    }
  }])

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
  } = new RunDefault(envs).run()

  ct.same(processedEnvs, [
    {
      type: 'env',
      string: 'HELLO=string',
      parsed: { HELLO: 'string' },
      injected: { HELLO: 'string' },
      preExisted: {}
    },
    {
      type: 'envFile',
      filepath: 'tests/monorepo/apps/frontend/.env',
      parsed: { HELLO: 'frontend' },
      injected: {},
      preExisted: { HELLO: 'string' }
    }
  ])

  ct.same(readableFilepaths, ['tests/monorepo/apps/frontend/.env'])
  ct.same(uniqueInjectedKeys, ['HELLO'])

  ct.end()
})
