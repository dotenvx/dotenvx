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
const Errors = require('../../src/lib/helpers/errors')

const fsx = require('../../src/lib/helpers/fsx')
const { logger } = require('../../src/shared/logger')

let writeStub

function setCode (error, code) {
  error.code = code
  const issueUrl = Errors.ISSUE_BY_CODE[code]
  if (issueUrl) {
    error.fix = `fix: [${issueUrl}]`
    error.help = `fix: [${issueUrl}]`
  }
  if (!Object.getOwnPropertyDescriptor(error, 'messageWithHelp')) {
    Object.defineProperty(error, 'messageWithHelp', {
      configurable: true,
      enumerable: true,
      get () {
        if (this.help && this.help.startsWith('fix:') && this.message) return `${this.message}. ${this.help}`
        return this.message
      }
    })
  }
}

t.beforeEach((ct) => {
  sinon.restore()
  writeStub = sinon.stub(fsx, 'writeFileXSync')
  process.env = {}
})

t.test('config calls Run.run',
  ct => {
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')

    stub.restore()

    ct.end()
  })

t.test('config with convention - calls Run.run with proper envs',
  ct => {
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config({ convention: 'nextjs' })

    t.ok(stub.called, 'new Run().run() called')

    stub.restore()

    ct.end()
  })

t.test('config with convention flow - calls Run.run with proper envs',
  ct => {
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config({ convention: 'flow' })

    t.ok(stub.called, 'new Run().run() called')

    stub.restore()

    ct.end()
  })

t.test('config with Run.run errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    error.help = 'some help'
    error.messageWithHelp = 'some error'
    const errors = [error]
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')
    ct.ok(loggerErrorStub.calledWith('some error'), 'logger.error')
    ct.notOk(loggerErrorStub.calledWith('some help'), 'logger.help')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with Run.run WRONG_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(error, 'WRONG_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
    const errors = [error]
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with Run.run MISSING_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
    setCode(error, 'MISSING_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
    const errors = [error]
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')
    ct.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with Run.run punctuated private-key errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const wrong = new Error('[WRONG_PRIVATE_KEY] punctuated')
    setCode(wrong, 'WRONG_PRIVATE_KEY')
    const missing = new Error('[MISSING_PRIVATE_KEY] punctuated')
    setCode(missing, 'MISSING_PRIVATE_KEY')
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{ errors: [wrong, missing] }], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with Run.run errors and ignore',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    setCode(error, 'SOME_ERROR')
    error.help = 'some help'
    const errors = [error]
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config({ ignore: ['SOME_ERROR'] })

    t.ok(stub.called, 'new Run().run() called')
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with Run.run processedEnv with undefined processedEnv.errors',
  ct => {
    const stub = sinon.stub(Run.prototype, 'run')
    stub.returns({ processedEnvs: [{}], readableFilepaths: [], uniqueInjectedKeys: [] })

    main.config()

    t.ok(stub.called, 'new Run().run() called')

    stub.restore()

    ct.end()
  })

t.test('config catches thrown error and returns parsed/error',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const loggerHelpStub = sinon.stub(logger, 'help')
    const thrown = new Error('boom')
    thrown.help = 'boom help'
    thrown.messageWithHelp = 'boom'

    const stub = sinon.stub(Run.prototype, 'run')
    stub.throws(thrown)

    const result = main.config()

    ct.same(result.parsed, {})
    ct.equal(result.error, thrown)
    ct.ok(loggerErrorStub.calledWith('boom'))
    ct.notOk(loggerHelpStub.called, 'logger.help not called')

    ct.end()
  })

t.test('config catches thrown WRONG_PRIVATE_KEY and returns parsed/error',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const loggerHelpStub = sinon.stub(logger, 'help')
    const thrown = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(thrown, 'WRONG_PRIVATE_KEY')

    const stub = sinon.stub(Run.prototype, 'run')
    stub.throws(thrown)

    const result = main.config()

    ct.same(result.parsed, {})
    ct.equal(result.error, thrown)
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"))
    ct.notOk(loggerHelpStub.called, 'logger.help not called for WRONG_PRIVATE_KEY')

    ct.end()
  })

t.test('config catches thrown MISSING_PRIVATE_KEY and returns parsed/error',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const loggerHelpStub = sinon.stub(logger, 'help')
    const thrown = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
    setCode(thrown, 'MISSING_PRIVATE_KEY')

    const stub = sinon.stub(Run.prototype, 'run')
    stub.throws(thrown)

    const result = main.config()

    ct.same(result.parsed, {})
    ct.equal(result.error, thrown)
    ct.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"))
    ct.notOk(loggerHelpStub.called, 'logger.help not called for MISSING_PRIVATE_KEY')

    ct.end()
  })

t.test('config catches thrown punctuated private-key errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const wrong = new Error('[WRONG_PRIVATE_KEY] punctuated')
    setCode(wrong, 'WRONG_PRIVATE_KEY')
    sinon.stub(Run.prototype, 'run').throws(wrong)
    main.config()
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))

    Run.prototype.run.restore()
    const missing = new Error('[MISSING_PRIVATE_KEY] punctuated')
    setCode(missing, 'MISSING_PRIVATE_KEY')
    sinon.stub(Run.prototype, 'run').throws(missing)
    main.config()
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    ct.end()
  })

t.test('parse calls Parse.run',
  ct => {
    const parsed = main.parse('HELLO=World')

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse calls Parse.run with options.processEnv',
  ct => {
    const parsed = main.parse('HELLO=World', { processEnv: {} })

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse calls Parse.run with options.privateKey',
  ct => {
    const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c' })

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse calls Parse.run with invalid options.privateKey',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: '12345' })
    ct.equal(parsed.HELLO, 'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l')
    ct.ok(loggerErrorStub.called, 'logger error')

    loggerErrorStub.restore()

    ct.end()
  })

t.test('parse logs WRONG_PRIVATE_KEY in one line',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(error, 'WRONG_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
    const mainWithWrongKeyError = proxyquire('../../src/lib/main', {
      './helpers/parse': class ParseMock {
        run () {
          return { parsed: { HELLO: 'World' }, errors: [error] }
        }
      }
    })

    const parsed = mainWithWrongKeyError.parse('HELLO=World')
    ct.equal(parsed.HELLO, 'World')
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger error one-line wrong private key')

    loggerErrorStub.restore()

    ct.end()
  })

t.test('parse logs MISSING_PRIVATE_KEY in one line',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const parsed = main.parse('HELLO="encrypted:abc123"')

    ct.equal(parsed.HELLO, 'encrypted:abc123')
    ct.ok(loggerErrorStub.calledWithMatch(/\[MISSING_PRIVATE_KEY\].*fix: \[https:\/\/github.com\/dotenvx\/dotenvx\/issues\/464\]/), 'logger error one-line missing private key')

    loggerErrorStub.restore()

    ct.end()
  })

t.test('parse keeps punctuated private-key messages',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const wrong = { message: '[WRONG_PRIVATE_KEY] punctuated' }
    setCode(wrong, 'WRONG_PRIVATE_KEY')
    const missing = { message: '[MISSING_PRIVATE_KEY] punctuated' }
    setCode(missing, 'MISSING_PRIVATE_KEY')
    const mainWithErrors = proxyquire('../../src/lib/main', {
      './helpers/parse': class ParseMock {
        run () {
          return { parsed: { HELLO: 'World' }, errors: [wrong, missing] }
        }
      }
    })

    const parsed = mainWithErrors.parse('HELLO=World')
    ct.equal(parsed.HELLO, 'World')
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    ct.end()
  })

t.test('parse logs one line for non-fix text',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const other = {
      code: 'OTHER_ERROR',
      message: '[OTHER_ERROR] boom',
      help: 'some help text',
      messageWithHelp: '[OTHER_ERROR] boom'
    }
    const mainWithErrors = proxyquire('../../src/lib/main', {
      './helpers/parse': class ParseMock {
        run () {
          return { parsed: { HELLO: 'World' }, errors: [other] }
        }
      }
    })

    const parsed = mainWithErrors.parse('HELLO=World')
    ct.equal(parsed.HELLO, 'World')
    ct.ok(loggerErrorStub.calledWith('[OTHER_ERROR] boom'))
    ct.notOk(loggerErrorStub.calledWith('some help text'))

    ct.end()
  })

t.test('ls calls Ls.run',
  ct => {
    const stub = sinon.stub(Ls.prototype, 'run')
    stub.returns({})

    main.ls()

    t.ok(stub.called, 'new Ls().run() called')

    stub.restore()

    ct.end()
  })

t.test('keypair calls Keypair.runSync',
  ct => {
    const stub = sinon.stub(Keypair.prototype, 'runSync')
    stub.returns({})

    main.keypair()

    t.ok(stub.called, 'new Keypair().runSync() called')

    stub.restore()

    ct.end()
  })

t.test('keypair calls Keypair.runSync with key specified',
  ct => {
    const stub = sinon.stub(Keypair.prototype, 'runSync')
    stub.returns({ KEY: 'value' })

    const result = main.keypair('.env', 'KEY')

    t.ok(stub.called, 'new Keypair().runSync() called')
    t.equal(result, 'value')

    stub.restore()

    ct.end()
  })

t.test('keypair calls Keypair.runSync with noOps true',
  ct => {
    const stub = sinon.stub(Keypair.prototype, 'runSync')
    stub.returns({ KEY: 'value' })

    const result = main.keypair('.env', 'KEY', null, true)

    t.ok(stub.called, 'new Keypair().runSync() called')
    t.equal(stub.thisValues[0].opsOn, false, 'Keypair was called with opsOn false')
    t.equal(result, 'value')

    stub.restore()

    ct.end()
  })

t.test('genexample calls Genexample.run',
  ct => {
    const stub = sinon.stub(Genexample.prototype, 'run')
    stub.returns({})

    main.genexample()

    t.ok(stub.called, 'new Genexample().run() called')

    stub.restore()

    ct.end()
  })

t.test('config monorepo/apps/backend/.env',
  ct => {
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

t.test('config monorepo/apps/backend/.env already set',
  ct => {
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

t.test('config monorepo/apps/backend/.env already set --overload',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND frontend/.env',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND frontend/.env --overload',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND frontend/missing',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend --strict it throws',
  ct => {
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

t.test('config monorepo/apps/backend/.env AND attempt on directory frontend --strict but error ALSO ignored',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
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
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('set calls Sets.run',
  ct => {
    const stub = sinon.stub(Sets.prototype, 'run')
    stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

    main.set('KEY', 'value')

    t.ok(stub.called, 'new Sets().run() called')
    t.equal(stub.thisValues[0].encrypt, true, 'Sets was called with encrypt true')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run with encrypt false',
  ct => {
    const stub = sinon.stub(Sets.prototype, 'run')
    stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

    main.set('KEY', 'value', { encrypt: false })

    t.ok(stub.called, 'new Sets().run() called')
    t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run with plain true',
  ct => {
    const stub = sinon.stub(Sets.prototype, 'run')
    stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

    main.set('KEY', 'value', { plain: true })

    t.ok(stub.called, 'new Sets().run() called')
    t.equal(stub.thisValues[0].encrypt, false, 'Sets was called with encrypt false')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run with custom envKeysFile',
  ct => {
    const stub = sinon.stub(Sets.prototype, 'run')
    stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

    main.set('KEY', 'value', { envKeysFile: 'path/to/.env.keys' })

    t.ok(stub.called, 'new Sets().run() called')

    t.equal(stub.thisValues[0].envKeysFilepath, 'path/to/.env.keys', 'Sets was called with custom .env.keys path')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run with noOps true',
  ct => {
    const stub = sinon.stub(Sets.prototype, 'run')
    stub.returns({ processedEnvs: [], changedFilepaths: [], unchangedFilepaths: [] })

    main.set('KEY', 'value', { noOps: true })

    t.ok(stub.called, 'new Sets().run() called')
    t.equal(stub.thisValues[0].opsOn, false, 'Sets was called with opsOn false')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - no change',
  ct => {
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
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - no change',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
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
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - changes',
  ct => {
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
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')
    t.ok(loggerInfoStub.notCalled, 'logger info')
    t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env)'), 'logger success')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - changes plain',
  ct => {
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

    main.set('HELLO', 'World', { plain: true })

    t.ok(stub.called, 'new Sets().run() called')
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')
    t.ok(loggerInfoStub.notCalled, 'logger info')
    t.ok(loggerSuccessStub.calledWith('◇ set HELLO (.env)'), 'logger success')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - MISSING_ENV_FILE',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Errors({ envFilepath: '.env' }).missingEnvFile()

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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - MISSING_ENV_FILE fallback filepath',
  ct => {
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const error = new Errors({ envFilepath: '.env' }).missingEnvFile()

    const stub = sinon.stub(Sets.prototype, 'run').returns({
      processedEnvs: [{
        key: 'HELLO',
        value: 'World',
        filepath: undefined,
        envFilepath: undefined,
        envSrc: 'HELLO=World',
        privateKeyAdded: false,
        privateKeyName: null,
        privateKey: null,
        error
      }],
      changedFilepaths: [],
      unchangedFilepaths: []
    })

    main.set('HELLO', 'World')

    t.ok(stub.called, 'new Sets().run() called')
    t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger warn fallback .env path')

    stub.restore()
    ct.end()
  })

t.test('set calls Sets.run - OTHER_ERROR',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Error('Mock Error')
    setCode(error, 'OTHER_ERROR')
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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - OTHER_ERROR fallback messageWithHelp absent with help',
  ct => {
    const loggerWarnStub = sinon.stub(logger, 'warn')

    const error = new Error('Mock Error')
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
    t.ok(loggerWarnStub.calledWith('Mock Error. some help'), 'logger.warn fallback includes help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - OTHER_ERROR fallback messageWithHelp absent without help',
  ct => {
    const loggerWarnStub = sinon.stub(logger, 'warn')

    const error = new Error('Mock Error')

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
    t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger.warn fallback uses base message')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - MISPAIRED_PRIVATE_KEY',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Error("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…)")
    setCode(error, 'MISPAIRED_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/752]'

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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…). fix: [https://github.com/dotenvx/dotenvx/issues/752]"), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - WRONG_PRIVATE_KEY',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(error, 'WRONG_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'

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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - MISSING_PRIVATE_KEY',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
    setCode(error, 'MISSING_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'

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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - INVALID_PUBLIC_KEY',
  ct => {
    const loggerNeutralStub = sinon.stub(logger, 'info')
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const loggerHelpStub = sinon.stub(logger, 'help')

    const error = new Error("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'")
    setCode(error, 'INVALID_PUBLIC_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/756]'

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
    t.ok(writeStub.notCalled, 'fsx.writeFileXSync')
    t.ok(loggerNeutralStub.calledWith('○ no change (.env)'), 'logger info')
    t.ok(loggerWarnStub.calledWith("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"), 'logger warn')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - preserves punctuated key errors',
  ct => {
    const loggerWarnStub = sinon.stub(logger, 'warn')
    const stub = sinon.stub(Sets.prototype, 'run').returns({
      processedEnvs: [{
        key: 'HELLO',
        value: 'World',
        filepath: '.env',
        envFilepath: '.env',
        envSrc: 'HELLO=World',
        privateKeyAdded: false,
        error: (() => {
          const error = { message: '[WRONG_PRIVATE_KEY] punctuated' }
          setCode(error, 'WRONG_PRIVATE_KEY')
          return error
        })()
      }, {
        key: 'HELLO',
        value: 'World',
        filepath: '.env',
        envFilepath: '.env',
        envSrc: 'HELLO=World',
        privateKeyAdded: false,
        error: (() => {
          const error = { message: '[MISSING_PRIVATE_KEY] punctuated' }
          setCode(error, 'MISSING_PRIVATE_KEY')
          return error
        })()
      }, {
        key: 'HELLO',
        value: 'World',
        filepath: '.env',
        envFilepath: '.env',
        envSrc: 'HELLO=World',
        privateKeyAdded: false,
        error: (() => {
          const error = { message: '[INVALID_PUBLIC_KEY] punctuated' }
          setCode(error, 'INVALID_PUBLIC_KEY')
          return error
        })()
      }, {
        key: 'HELLO',
        value: 'World',
        filepath: '.env',
        envFilepath: '.env',
        envSrc: 'HELLO=World',
        privateKeyAdded: false,
        error: (() => {
          const error = { message: '[MISPAIRED_PRIVATE_KEY] punctuated' }
          setCode(error, 'MISPAIRED_PRIVATE_KEY')
          return error
        })()
      }],
      changedFilepaths: [],
      unchangedFilepaths: []
    })

    main.set('HELLO', 'World')

    t.ok(stub.called, 'new Sets().run() called')
    t.ok(loggerWarnStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
    t.ok(loggerWarnStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
    t.ok(loggerWarnStub.calledWith('[INVALID_PUBLIC_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/756]'))
    t.ok(loggerWarnStub.calledWith('[MISPAIRED_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/752]'))

    stub.restore()
    ct.end()
  })

t.test('set calls Sets.run - privateKeyAdded',
  ct => {
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
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')
    t.ok(loggerInfoStub.notCalled, 'logger info')
    t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - privateKeyAdded and not ignoring .env.keys',
  ct => {
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
    t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileXSync .env')
    t.ok(loggerInfoStub.notCalled, 'logger info')
    t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
    t.ok(loggerHelpStub.notCalled, 'logger help')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - privateKeyAdded with unchanged file still reports key addition',
  ct => {
    const loggerSuccessStub = sinon.stub(logger, 'success')
    const loggerNeutralStub = sinon.stub(logger, 'info')

    const stub = sinon.stub(Sets.prototype, 'run').returns({
      processedEnvs: [{
        key: 'HELLO',
        value: 'dude',
        filepath: '.env',
        envFilepath: '.env',
        envKeysFilepath: '.env.keys',
        envSrc: 'HELLO=dude',
        privateKeyAdded: true,
        privateKeyName: 'DOTENV_PRIVATE_KEY',
        privateKey: '1234',
        error: null
      }],
      changedFilepaths: [],
      unchangedFilepaths: ['.env']
    })

    main.set('HELLO', 'dude')

    t.ok(stub.called, 'new Sets().run() called')
    t.ok(writeStub.calledWith('.env', 'HELLO=dude'), 'fsx.writeFileXSync .env')
    t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
    t.ok(loggerNeutralStub.notCalled, 'logger info')

    stub.restore()

    ct.end()
  })

t.test('set calls Sets.run - privateKeyAdded missing envFilepath falls back to .env',
  ct => {
    const loggerSuccessStub = sinon.stub(logger, 'success')
    const loggerInfoStub = sinon.stub(logger, 'info')

    const stub = sinon.stub(Sets.prototype, 'run').returns({
      processedEnvs: [{
        key: 'HELLO',
        value: 'dude',
        filepath: '.env',
        envFilepath: undefined,
        envKeysFilepath: '.env.keys',
        envSrc: 'HELLO=dude',
        privateKeyAdded: true,
        privateKeyName: 'DOTENV_PRIVATE_KEY',
        privateKey: '1234',
        error: null
      }],
      changedFilepaths: [],
      unchangedFilepaths: []
    })

    main.set('HELLO', 'dude')

    t.ok(stub.called, 'new Sets().run() called')
    t.ok(writeStub.calledWith('.env', 'HELLO=dude'), 'fsx.writeFileXSync .env')
    t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
    t.ok(loggerInfoStub.notCalled, 'logger info')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: [] })

    const result = main.get('KEY')
    t.equal(result, 'value')

    t.ok(stub.called, 'new Get().run() called')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run undefined',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: undefined }, errors: [] })

    const result = main.get('KEY')
    t.equal(result, undefined)

    t.ok(stub.called, 'new Get().run() called')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run with no key',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: [] })

    const result = main.get(null)
    t.equal(result.KEY, 'value')

    t.ok(stub.called, 'new Get().run() called')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run format eval',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: [] })

    const result = main.get(null, { format: 'eval' })
    t.equal(result, 'KEY=value')

    t.ok(stub.called, 'new Get().run() called')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run format shell',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: [] })

    const result = main.get(null, { format: 'shell' })
    t.equal(result, 'KEY=value')

    t.ok(stub.called, 'new Get().run() called')

    stub.restore()

    ct.end()
  })

t.test('get calls Get.run with noOps true',
  ct => {
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: [] })

    const result = main.get('KEY', { noOps: true })
    t.equal(result, 'value')

    t.ok(stub.called, 'new Get().run() called')
    t.equal(stub.thisValues[0].opsOn, false, 'Get was called with opsOn false')

    stub.restore()

    ct.end()
  })

t.test('get monorepo/apps/backend/.env AND attempt on directory frontend --strict it throws',
  ct => {
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

t.test('get with Get.run errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    setCode(error, 'SOME_ERROR')
    error.help = 'some help'
    const errors = [error]
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors })

    main.get('KEY')

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.called, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get with Get.run WRONG_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(error, 'WRONG_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
    const errors = [error]
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors })

    main.get('KEY')

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get with Get.run MISSING_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
    setCode(error, 'MISSING_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
    const errors = [error]
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors })

    main.get('KEY')

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get with Get.run punctuated private key errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const errors = [
      (() => {
        const error = { message: '[WRONG_PRIVATE_KEY] punctuated' }
        setCode(error, 'WRONG_PRIVATE_KEY')
        return error
      })(),
      (() => {
        const error = { message: '[MISSING_PRIVATE_KEY] punctuated' }
        setCode(error, 'MISSING_PRIVATE_KEY')
        return error
      })()
    ]
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors })

    main.get('KEY')

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get with Get.run undefined errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors: undefined })

    main.get('KEY')

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get with Get.run errors and ignore',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    setCode(error, 'SOME_ERROR')
    error.help = 'some help'
    const errors = [error]
    const stub = sinon.stub(Get.prototype, 'run')
    stub.returns({ parsed: { KEY: 'value' }, errors })

    main.get('KEY', { ignore: ['SOME_ERROR'] })

    t.ok(stub.called, 'new Get().run() called')
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })
