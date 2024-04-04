const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const RunDefault = require('../../../src/lib/services/runDefault')

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}
})

t.test('#run (no arguments)', ct => {
  const {
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(files, [{
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault().run()

  const exampleError = new Error('Mock Error')

  ct.same(files, [{
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  ct.same(files, [{
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  ct.same(files, [{
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(files, [{
    filepath: 'tests/monorepo/apps/frontend/.env',
    parsed: {
      HELLO: 'World'
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs, true).run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(files, [{
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
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  ct.same(files, [{
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
    strings,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(envs).run()

  ct.same(strings, [{
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
    strings,
    readableFilepaths,
    uniqueInjectedKeys
  } = runDefault.run()

  ct.same(strings, [{
    string: 'HELLO=string',
    error: mockError,
    parsed: {
      HELLO: "string"
    }
  }])

  injectStub.restore()

  ct.end()
})
