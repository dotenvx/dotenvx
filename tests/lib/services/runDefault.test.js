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
  const {
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault('tests/monorepo/apps/frontend/.env').run()

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
  const {
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault(['tests/monorepo/apps/frontend/.env']).run()

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

  const {
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault('tests/monorepo/apps/frontend/.env').run()

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

  const {
    files,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault('tests/monorepo/apps/frontend/.env', null, true).run()

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

t.test('#run (with envs as string)', ct => {
  const {
    strings,
    readableFilepaths,
    uniqueInjectedKeys
  } = new RunDefault([], 'HELLO=string').run()

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
