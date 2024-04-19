const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')

const Sets = require('../../../src/lib/services/sets')

let writeFileSyncStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
})

t.afterEach((ct) => {
  writeFileSyncStub.restore()
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync').throws(new Error('Mock Error'))

  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: '.env',
    error: exampleError
  }])
  ct.same(settableFilepaths, [])

  readFileSyncStub.restore()

  ct.end()
})

t.test('#run (finds .env file)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets('KEY', 'value', envFile).run()

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    filepath: 'tests/monorepo/apps/frontend/.env'
  }])
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

  sinon.assert.calledOnceWithExactly(writeFileSyncStub, path.resolve(envFile), '# for testing purposes only\nHELLO="frontend"\nKEY="value"\n')

  ct.end()
})

t.test('#run (finds .env file and overwrites existing key/value)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets('HELLO', 'new value', envFile).run()

  ct.same(processedEnvFiles, [{
    key: 'HELLO',
    value: 'new value',
    filepath: 'tests/monorepo/apps/frontend/.env'
  }])
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

  sinon.assert.calledOnceWithExactly(writeFileSyncStub, path.resolve(envFile), '# for testing purposes only\nHELLO="new value"\n')

  ct.end()
})

t.test('#run (finds .env file as array)', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets('KEY', 'value', [envFile]).run()

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    filepath: 'tests/monorepo/apps/frontend/.env'
  }])
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

  sinon.assert.calledOnceWithExactly(writeFileSyncStub, path.resolve(envFile), '# for testing purposes only\nHELLO="frontend"\nKEY="value"\n')

  ct.end()
})

t.test('#_srcAppended when src has no newline it prepends a newline', ct => {
  const sets = new Sets('KEY', 'value')
  const src = 'HELLO=World'
  const result = sets._srcAppended(src)

  ct.same(result, 'HELLO=World\nKEY="value"')

  ct.end()
})
