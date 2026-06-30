const t = require('tap')
const sinon = require('sinon')

const main = require('../../src/lib/main')

const envsResolver = require('../../src/lib/resolvers/envs')
const Errors = require('../../src/lib/helpers/errors')

const { logger } = require('../../src/shared/logger')

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
  process.env = {}
})

t.test('config calls envs resolver',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')

    stub.restore()

    ct.end()
  })

t.test('config supports noArmor option',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ noArmor: true })

    t.ok(stub.called, 'envsResolver.sync() called')
    t.equal(stub.firstCall.args[0].noArmor, true, 'envs resolver was called with noArmor true')

    stub.restore()

    ct.end()
  })

t.test('config supports noSpinner option',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ noSpinner: true })

    t.ok(stub.called, 'envsResolver.sync() called')
    t.equal(stub.firstCall.args[0].noSpinner, true, 'envs resolver was called with noSpinner true')

    stub.restore()

    ct.end()
  })

t.test('config supports token option',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ token: 'token-123' })

    t.ok(stub.called, 'envsResolver.sync() called')
    t.equal(stub.firstCall.args[0].noArmor, false, 'envs resolver was called with Armor enabled')
    t.equal(stub.firstCall.args[0].token, 'token-123', 'envs resolver was called with Armor token')

    stub.restore()

    ct.end()
  })

t.test('config with convention - calls envs resolver with proper envs',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ convention: 'nextjs' })

    t.ok(stub.called, 'envsResolver.sync() called')

    stub.restore()

    ct.end()
  })

t.test('config with convention flow - calls envs resolver with proper envs',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ convention: 'flow' })

    t.ok(stub.called, 'envsResolver.sync() called')

    stub.restore()

    ct.end()
  })

t.test('config with envs ignores path and convention',
  ct => {
    const envs = [{ type: 'env', value: 'HELLO=envs' }]
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    main.config({ path: 'tests/.env', convention: 'nextjs', envs })

    t.ok(stub.called, 'envsResolver.sync() called')
    t.same(stub.firstCall.args[0].envs, envs)

    stub.restore()

    ct.end()
  })

t.test('config with envs resolver errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    error.help = 'some help'
    error.messageWithHelp = 'some error'
    const errors = [error]
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.calledWith('some error'), 'logger.error')
    ct.notOk(loggerErrorStub.calledWith('some help'), 'logger.help')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with envs resolver WRONG_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
    setCode(error, 'WRONG_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
    const errors = [error]
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with envs resolver MISSING_PRIVATE_KEY errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
    setCode(error, 'MISSING_PRIVATE_KEY')
    error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
    const errors = [error]
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error one-line')
    ct.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'no separate help line')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with envs resolver punctuated private-key errors',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const wrong = new Error('[WRONG_PRIVATE_KEY] punctuated')
    setCode(wrong, 'WRONG_PRIVATE_KEY')
    const missing = new Error('[MISSING_PRIVATE_KEY] punctuated')
    setCode(missing, 'MISSING_PRIVATE_KEY')
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{ errors: [wrong, missing] }], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with envs resolver errors and ignore',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')

    const error = new Error('some error')
    setCode(error, 'SOME_ERROR')
    error.help = 'some help'
    const errors = [error]
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{ errors }], readableFilepaths: [] })

    main.config({ ignore: ['SOME_ERROR'] })

    t.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('config with envs resolver processedEnv with undefined processedEnv.errors',
  ct => {
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [{}], readableFilepaths: [] })

    main.config()

    t.ok(stub.called, 'envsResolver.sync() called')

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

    const stub = sinon.stub(envsResolver, 'sync')
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

    const stub = sinon.stub(envsResolver, 'sync')
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

    const stub = sinon.stub(envsResolver, 'sync')
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
    sinon.stub(envsResolver, 'sync').throws(wrong)
    main.config()
    ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))

    envsResolver.sync.restore()
    const missing = new Error('[MISSING_PRIVATE_KEY] punctuated')
    setCode(missing, 'MISSING_PRIVATE_KEY')
    sinon.stub(envsResolver, 'sync').throws(missing)
    main.config()
    ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

    ct.end()
  })

t.test('parse parses plaintext',
  ct => {
    const parsed = main.parse('HELLO=World')

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse parses plaintext with options.processEnv',
  ct => {
    const parsed = main.parse('HELLO=World', { processEnv: {} })

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse decrypts with options.privateKey',
  ct => {
    const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: 'a4547dcd9d3429615a3649bb79e87edb62ee6a74b007075e9141ae44f5fb412c' })

    ct.equal(parsed.HELLO, 'World')

    ct.end()
  })

t.test('parse logs invalid options.privateKey',
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

    const parsed = main.parse('HELLO="encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l"', { privateKey: 'ec9e80073d7ace817d35acb8b7293cbf8e5981b4d2f5708ee5be405122993cd1' })
    ct.equal(parsed.HELLO, 'encrypted:BE9Y7LKANx77X1pv1HnEoil93fPa5c9rpL/1ps48uaRT9zM8VR6mHx9yM+HktKdsPGIZELuZ7rr2mn1gScsmWitppAgE/1lVprNYBCqiYeaTcKXjDUXU5LfsEsflnAsDhT/kWG1l')
    ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=ec9e800…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger error one-line wrong private key')

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

t.test('parse ignores configured error codes',
  ct => {
    const loggerErrorStub = sinon.stub(logger, 'error')
    const loggerVerboseStub = sinon.stub(logger, 'verbose')

    const parsed = main.parse('HELLO="encrypted:abc123"', { ignore: ['MISSING_PRIVATE_KEY'] })
    ct.equal(parsed.HELLO, 'encrypted:abc123')
    ct.ok(loggerVerboseStub.calledWithMatch(/ignored: \[MISSING_PRIVATE_KEY\] could not decrypt HELLO/))
    ct.notOk(loggerErrorStub.called, 'ignored error is not logged as an error')

    ct.end()
  })

t.test('ls finds env files',
  ct => {
    const dir = ct.testdir({
      '.env': '',
      '.env.local': '',
      nested: {
        '.env.production': '',
        'not-env.txt': ''
      }
    })

    const files = main.ls(dir).sort()

    ct.same(files, [
      '.env',
      '.env.local',
      'nested/.env.production'
    ].sort())

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
    const stub = sinon.stub(envsResolver, 'sync')
    stub.returns({ processedEnvs: [], readableFilepaths: [] })

    const processEnv = {}
    const options = {
      processEnv,
      path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend'],
      strict: true,
      ignore: ['MISSING_ENV_FILE']
    }

    main.config(options)

    ct.ok(stub.called, 'envsResolver.sync() called')
    ct.ok(loggerErrorStub.notCalled, 'logger.error')

    stub.restore()
    loggerErrorStub.restore()

    ct.end()
  })

t.test('get monorepo/apps/backend/.env AND attempt on directory frontend --strict it throws',
  async ct => {
    const processEnv = {}

    const options = {
      processEnv,
      path: ['tests/monorepo/apps/backend/.env', 'tests/monorepo/apps/frontend'],
      strict: true
    }

    await ct.rejects(main.get('HELLO', options), { code: 'MISSING_ENV_FILE' })

    ct.end()
  })
