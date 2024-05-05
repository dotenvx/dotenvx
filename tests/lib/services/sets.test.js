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

t.test('#run (finds .env file) with --encrypt', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    settableFilepaths
  } = new Sets('KEY', 'value', envFile, true).run()

  const row = processedEnvFiles[0]
  const publicKey = row.publicKey
  const encryptedValue = row.encryptedValue

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    encryptedValue,
    publicKey,
    filepath: 'tests/monorepo/apps/frontend/.env'
  }])
  ct.same(settableFilepaths, ['tests/monorepo/apps/frontend/.env'])

  const output = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    '# for testing purposes only',
    'HELLO="frontend"',
    `KEY="${encryptedValue}"`
  ].join('\n')

  sinon.assert.calledWithExactly(writeFileSyncStub.getCall(2), path.resolve(envFile), output + '\n')

  ct.end()
})
