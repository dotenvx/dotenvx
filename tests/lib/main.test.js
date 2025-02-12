const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const main = proxyquire('../../src/lib/main', {
  '../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

const Ls = require('../../src/lib/services/ls')
const Run = require('../../src/lib/services/run')
const Sets = require('../../src/lib/services/sets')
const Get = require('../../src/lib/services/get')
const Keypair = require('../../src/lib/services/keypair')
const Genexample = require('../../src/lib/services/genexample')

const fsx = require('../../src/lib/helpers/fsx')
const { logger } = require('../../src/shared/logger')

let writeStub

t.beforeEach((ct) => {
  sinon.restore()
  writeStub = sinon.stub(fsx, 'writeFileX')
  process.env = {}
})

t.test('config calls Run.run', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('config with convention - calls Run.run with proper envs', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config({ convention: 'nextjs' })

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('config with Run.run errors', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')

  const error = new Error('some error')
  error.help = 'some help'
  const errors = [error]
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerErrorStub.calledWith('some error'), 'console.error')
  ct.ok(loggerErrorStub.calledWith('some help'), 'logger.help')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})

t.test('config with Run.run errors and ignore', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')

  const error = new Error('some error')
  error.code = 'SOME_ERROR'
  error.help = 'some help'
  const errors = [error]
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config({ ignore: ['SOME_ERROR'] })

  t.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerErrorStub.notCalled, 'console.error')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})

t.test('config with Run.run processedEnv with undefined processedEnv.errors', ct => {
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [{}], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.config()

  t.ok(stub.called, 'new Run().run() called')

  stub.restore()

  ct.end()
})

t.test('parse calls Parse.run', ct => {
  const parsed = main.parse('HELLO=World')

  ct.equal(parsed.HELLO, 'World')

  ct.end()
})

t.test('parse calls Parse.run with options.processEnv', ct => {
  const parsed = main.parse('HELLO=World', { processEnv: {} })

  ct.equal(parsed.HELLO, 'World')

  ct.end()
})

t.test('parse calls Parse.run with options.privateKey', ct => {
  const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c' })

  ct.equal(parsed.HELLO, 'World')

  ct.end()
})

t.test('parse calls Parse.run with invalid options.privateKey', ct => {
  const consoleErrorStub = sinon.stub(console, 'error')

  const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: '12345' })
  ct.equal(parsed.HELLO, 'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l')
  ct.ok(consoleErrorStub.called, 'console error')

  consoleErrorStub.restore()

  ct.end()
})

t.test('ls calls Ls.run', ct => {
  const stub = sinon.stub(Ls.prototype, 'run')
  stub.returns({})

  main.ls()

  t.ok(stub.called, 'new Ls().run() called')

  stub.restore()

  ct.end()
})

t.test('keypair calls Keypair.run', ct => {
  const stub = sinon.stub(Keypair.prototype, 'run')
  stub.returns({})

  main.keypair()

  t.ok(stub.called, 'new Keypair().run() called')

  stub.restore()

  ct.end()
})

t.test('keypair calls Keypair.run with key specified', ct => {
  const stub = sinon.stub(Keypair.prototype, 'run')
  stub.returns({ KEY: 'value' })

  const result = main.keypair('.env', 'KEY')

  t.ok(stub.called, 'new Keypair().run() called')
  t.equal(result, 'value')

  stub.restore()

  ct.end()
})

t.test('genexample calls Genexample.run', ct => {
  const stub = sinon.stub(Genexample.prototype, 'run')
  stub.returns({})

  main.genexample()

  t.ok(stub.called, 'new Genexample().run() called')

  stub.restore()

  ct.end()
})

t.test('config monorepo/apps/backend/.env', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env']
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'backend')
  t.equal(parsed.HELLO, 'backend')
  t.equal(error, undefined)

  ct.end()
})

t.test('config monorepo/apps/backend/.env alredy set', ct => {
  const processEnv = {
    HELLO: 'world'
  }

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env']
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'world')
  t.equal(parsed.HELLO, 'world')
  t.equal(error, undefined)

  ct.end()
})

t.test('config monorepo/apps/backend/.env alredy set --overload', ct => {
  const processEnv = {
    HELLO: 'world'
  }

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env'],
    overload: true
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'backend')
  t.equal(parsed.HELLO, 'backend')
  t.equal(error, undefined)

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND frontend/.env', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend/.env']
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'backend')
  t.equal(parsed.HELLO, 'backend')
  t.equal(error, undefined)

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND frontend/.env --overload', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend/.env'],
    overload: true
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'frontend')
  t.equal(parsed.HELLO, 'frontend')
  t.equal(error, undefined)

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND frontend/missing', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend/missing']
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'backend')
  t.equal(parsed.HELLO, 'backend')
  t.equal(error.code, 'MISSING_ENV_FILE')

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend']
  }

  const { parsed, error } = main.config(options)

  t.equal(processEnv.HELLO, 'backend')
  t.equal(parsed.HELLO, 'backend')
  t.equal(error.code, 'MISSING_ENV_FILE')

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend --strict it throws', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend'],
    strict: true
  }

  try {
    main.config(options)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.code, 'MISSING_ENV_FILE')
  }

  ct.end()
})

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend --strict but error ALSO ignored', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  const processEnv = {}
  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend'],
    strict: true,
    ignore: ['MISSING_ENV_FILE']
  }

  main.config(options)

  ct.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerErrorStub.notCalled, 'console.error')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})

t.test('set calls Sets.run', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

  main.set('KEY', 'value')

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, true, 'Sets was called with encrypt true')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with encrypt false', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

  main.set('KEY', 'value', { encrypt: false })

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with plain true', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

  main.set('KEY', 'value', { plain: true })

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with custom envKeysFile', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

  main.set('KEY', 'value', { envKeysFile: 'path/to/.env.keys' })

  t.ok(stub.called, 'new Sets().run() called')

  t.equal(stub.thisValues[0].envKeysFilepath, 'path/to/.env.keys', 'Sets was called with custom .env.keys path')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - no changes', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  const processedEnvs = [{
    key: 'HELLO',
    value: 'World',
    filepath: '.env',
    envFilepath: '.env',
    envSrc: 'HELLO=World',
    privateKeyAdded: false,
    privateKeyName: null,
    privateKey: null,
    error: null
  }]
  stub.returns({ processedEnvs, changedFilepaths: [], unchangedFilepaths: [] })

  main.set('KEY', 'value')

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, true, 'Sets was called with encrypt true')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - no changes', ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error: null
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  main.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - changes', ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })

  main.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - MISSING_ENV_FILE', ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'

  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  main.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
  t.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and re-run [dotenvx set]'), 'logger help')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - OTHER_ERROR', ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  error.help = 'some help'

  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: 'HELLO=World',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error
    }],
    changedFilepaths: [],
    unchangedFilepaths: ['.env']
  })

  main.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.calledWith('no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
  t.ok(loggerHelpStub.calledWith('some help'), 'logger help')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - privateKeyAdded', ct => {
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envKeysFilepath: '.env.keys',
      envSrc: 'HELLO=World',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: '1234',
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })

  main.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')
  t.ok(loggerSuccessStub.calledWith('✔ key added to .env.keys (DOTENV_PRIVATE_KEY)'), 'logger success')
  t.ok(loggerHelpStub.calledWith('⮕  next run [DOTENV_PRIVATE_KEY=\'1234\' dotenvx get HELLO] to test decryption locally'), 'logger help')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run - privateKeyAdded and not ignoring .env.keys', ct => {
  const mainNotIgnoring = proxyquire('../../src/lib/main', {
    '../../src/lib/helpers/isIgnoringDotenvKeys': () => false
  })

  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envKeysFilepath: '.env.keys',
      envSrc: 'HELLO=World',
      privateKeyAdded: true,
      privateKeyName: 'DOTENV_PRIVATE_KEY',
      privateKey: '1234',
      error: null
    }],
    changedFilepaths: ['.env'],
    unchangedFilepaths: []
  })

  mainNotIgnoring.set('HELLO', 'World')

  t.ok(stub.called, 'new Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('✔ set HELLO with encryption (.env)'), 'logger success')
  t.ok(loggerSuccessStub.calledWith('✔ key added to .env.keys (DOTENV_PRIVATE_KEY)'), 'logger success')
  t.ok(loggerHelpStub.calledWith('⮕  next run [dotenvx ext gitignore --pattern .env.keys] to gitignore .env.keys'), 'logger help')
  t.ok(loggerHelpStub.calledWith('⮕  next run [DOTENV_PRIVATE_KEY=\'1234\' dotenvx get HELLO] to test decryption locally'), 'logger help')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors: [] })

  const result = main.get('KEY')
  t.equal(result, 'value')

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run undefined', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: undefined }, errors: [] })

  const result = main.get('KEY')
  t.equal(result, undefined)

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run with no key', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors: [] })

  const result = main.get(null)
  t.equal(result.KEY, 'value')

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run format eval', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors: [] })

  const result = main.get(null, { format: 'eval' })
  t.equal(result, 'KEY=value')

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('get calls Get.run format shell', ct => {
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors: [] })

  const result = main.get(null, { format: 'shell' })
  t.equal(result, 'KEY=value')

  t.ok(stub.called, 'new Get().run() called')

  stub.restore()

  ct.end()
})

t.test('get monorepo/apps/backend/.env AND attempt on directory frontend --strict it throws', ct => {
  const processEnv = {}

  const options = {
    processEnv,
    path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend'],
    strict: true
  }

  try {
    main.get('HELLO', options)
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.equal(error.code, 'MISSING_ENV_FILE')
  }

  ct.end()
})

t.test('get with Get.run errors', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')

  const error = new Error('some error')
  error.code = 'SOME_ERROR'
  error.help = 'some help'
  const errors = [error]
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors })

  main.get('KEY')

  t.ok(stub.called, 'new Get().run() called')
  ct.ok(loggerErrorStub.called, 'console.error')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})

t.test('get with Get.run undefined errors', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')

  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors: undefined })

  main.get('KEY')

  t.ok(stub.called, 'new Get().run() called')
  ct.ok(loggerErrorStub.notCalled, 'console.error')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})

t.test('get with Get.run errors and ignore', ct => {
  const loggerErrorStub = sinon.stub(console, 'error')

  const error = new Error('some error')
  error.code = 'SOME_ERROR'
  error.help = 'some help'
  const errors = [error]
  const stub = sinon.stub(Get.prototype, 'run')
  stub.returns({ parsed: { KEY: 'value' }, errors })

  main.get('KEY', { ignore: ['SOME_ERROR'] })

  t.ok(stub.called, 'new Get().run() called')
  ct.ok(loggerErrorStub.notCalled, 'console.error')

  stub.restore()
  loggerErrorStub.restore()

  ct.end()
})
