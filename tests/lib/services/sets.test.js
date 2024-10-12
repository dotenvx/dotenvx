const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const path = require('path')
const sinon = require('sinon')

const Sets = require('../../../src/lib/services/sets')

let writeFileXStub

t.beforeEach((ct) => {
  // important, clear process.env before each test
  process.env = {}

  writeFileXStub = sinon.stub(fsx, 'writeFileX')
})

t.afterEach((ct) => {
  writeFileXStub.restore()
})

t.test('#run (no arguments)', ct => {
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  ct.end()
})

t.test('#run (no env file)', ct => {
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets().run()

  const exampleError = new Error(`missing .env file (${path.resolve('.env')})`)
  exampleError.code = 'MISSING_ENV_FILE'

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  ct.end()
})

t.test('#run (no arguments and some other error)', ct => {
  const readFileXStub = sinon.stub(fsx, 'readFileX').throws(new Error('Mock Error'))

  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets().run()

  const exampleError = new Error('Mock Error')

  ct.same(processedEnvFiles, [{
    key: null,
    value: null,
    filepath: path.resolve('.env'),
    envFilepath: '.env',
    changed: false,
    error: exampleError
  }])
  ct.same(changedFilepaths, [])

  readFileXStub.restore()

  ct.end()
})

t.test('#run (encrypt off) (finds .env file)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    'KEY=\'value\''
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets('KEY', 'value', envFile, false).run()

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file and overwrites existing key/value)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO=\'new value\' # this is a comment'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets('HELLO', 'new value', envFile, false).run()

  ct.same(processedEnvFiles, [{
    key: 'HELLO',
    value: 'new value',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    originalValue: 'frontend',
    changed: true,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file and attempts overwrite with same key/value)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment'
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths,
    unchangedFilepaths
  } = new Sets('HELLO', 'frontend', envFile, false).run()

  ct.same(processedEnvFiles, [{
    key: 'HELLO',
    value: 'frontend',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: false,
    originalValue: 'frontend',
    envSrc
  }])
  ct.same(changedFilepaths, [])
  ct.same(unchangedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (encrypt off) (finds .env file as array)', ct => {
  const envSrc = [
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    'KEY=\'value\''
  ].join('\n') + '\n'

  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets('KEY', 'value', [envFile], false).run()

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})

t.test('#run (finds .env file) with --encrypt', ct => {
  const envFile = 'tests/monorepo/apps/frontend/.env'
  const {
    processedEnvFiles,
    changedFilepaths
  } = new Sets('KEY', 'value', envFile).run()

  const row = processedEnvFiles[0]
  const publicKey = row.publicKey
  const privateKey = row.privateKey
  const privateKeyAdded = row.privateKeyAdded
  const privateKeyName = row.privateKeyName
  const encryptedValue = row.encryptedValue
  const envSrc = [
    '#/-------------------[DOTENV_PUBLIC_KEY]--------------------/',
    '#/            public-key encryption for .env files          /',
    '#/       [how it works](https://dotenvx.com/encryption)     /',
    '#/----------------------------------------------------------/',
    `DOTENV_PUBLIC_KEY="${publicKey}"`,
    '',
    '# .env',
    '# for testing purposes only',
    'HELLO="frontend" # this is a comment',
    `KEY='${encryptedValue}'`
  ].join('\n') + '\n'

  ct.same(processedEnvFiles, [{
    key: 'KEY',
    value: 'value',
    filepath: path.resolve('tests/monorepo/apps/frontend/.env'),
    envFilepath: 'tests/monorepo/apps/frontend/.env',
    changed: true,
    originalValue: null,
    encryptedValue,
    publicKey,
    privateKey,
    privateKeyAdded,
    privateKeyName,
    envSrc
  }])
  ct.same(changedFilepaths, ['tests/monorepo/apps/frontend/.env'])

  ct.end()
})
