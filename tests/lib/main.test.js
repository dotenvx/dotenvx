const t = require('tap')
const sinon = require('sinon')

const main = require('../../src/lib/main')

const Ls = require('../../src/lib/services/ls')
const Run = require('../../src/lib/services/run')
const Sets = require('../../src/lib/services/sets')
const Keypair = require('../../src/lib/services/keypair')
const Genexample = require('../../src/lib/services/genexample')

t.beforeEach((ct) => {
  sinon.restore()
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

t.test('set calls Sets.run', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.set('KEY', 'value')

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, true, 'Sets was called with encrypt true')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with encrypt false', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.set('KEY', 'value', { encrypt: false })

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with plain true', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.set('KEY', 'value', { plain: true })

  t.ok(stub.called, 'new Sets().run() called')
  t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

  stub.restore()

  ct.end()
})

t.test('set calls Sets.run with custom envKeysFile', ct => {
  const stub = sinon.stub(Sets.prototype, 'run')
  stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

  main.set('KEY', 'value', { envKeysFile: 'path/to/.env.keys' })

  t.ok(stub.called, 'new Sets().run() called')

  t.equal(stub.thisValues[0].envKeysFilepath, 'path/to/.env.keys', 'Sets was called with custom .env.keys path')

  stub.restore()

  ct.end()
})
