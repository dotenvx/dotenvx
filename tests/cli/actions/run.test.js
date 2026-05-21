const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Run = require('./../../../src/lib/services/run')
const Errors = require('./../../../src/lib/helpers/errors')
const { logger } = require('../../../src/shared/logger')

const run = proxyquire('../../../src/cli/actions/run', {
  '../../../src/lib/helpers/executeCommand': async () => true
})

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

t.test('run', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run passes spinner text handoff hooks to Run service', async ct => {
  const spinner = {
    stop: sinon.stub(),
    start: sinon.stub()
  }
  let runArgs
  class RunStub {
    constructor (...args) {
      runArgs = args
    }

    async run () {
      await runArgs[5].beforeOpsKeypair()
      await runArgs[5].afterOpsKeypair()
      return {
        processedEnvs: [],
        readableStrings: [],
        readableFilepaths: [],
        uniqueInjectedKeys: []
      }
    }
  }
  class SessionStub {
    async noOps () {
      return false
    }
  }
  const runWithStubs = proxyquire('../../../src/cli/actions/run', {
    './../../lib/helpers/executeCommand': async () => true,
    './../../lib/services/run': RunStub,
    '../../lib/helpers/createSpinner': async () => spinner,
    '../../db/session': SessionStub
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const fakeContext = { opts: () => ({}), args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])

  await runWithStubs.call(fakeContext)

  ct.equal(spinner.stop.callCount, 1)
  ct.equal(spinner.start.callCount, 2)
  ct.equal(spinner.start.firstCall.args[0], 'retrieving')
  ct.equal(spinner.start.secondCall.args[0], 'injecting')
  ct.equal(loggerSuccessvStub.callCount, 1)
  ct.end()
})

t.test('run --convention', async ct => {
  const optsStub = sinon.stub().returns({ convention: 'nextjs' })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run --ops-off passes noOps true to Run service', async ct => {
  const optsStub = sinon.stub().returns({ opsOff: true })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--ops-off', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.equal(stub.thisValues[0].noOps, true, 'Run was called with noOps true')

  ct.end()
})

t.test('run --convention', async ct => {
  const optsStub = sinon.stub().returns({ convention: 'flow' })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - envFile', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')

  ct.end()
})

t.test('run - envFile (with errors)', async ct => {
  const error = new Error('[DECRYPTION_FAILED] could not decrypt HELLO using private key d607fff…')
  setCode(error, 'DECRYPTION_FAILED')

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      errors: [error],
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerErrorStub.calledWith('[DECRYPTION_FAILED] could not decrypt HELLO using private key d607fff…. fix: [https://github.com/dotenvx/dotenvx/issues/757]'), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('[DECRYPTION_FAILED] ? encrypted data looks malformed'), 'logger.help')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')

  ct.end()
})

t.test('run - env', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'env',
      string: 'HELLO=World',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: ['HELLO=World'],
    readableFilepaths: [],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HELLO=World)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from --env flag'), 'logger.successv')

  ct.end()
})

t.test('run - envFile AND env', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'env',
      string: 'HELLO=World',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    },
    {
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: ['HELLO=World'],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HELLO=World)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env, and --env flag'), 'logger.successv')

  ct.end()
})

t.test('run - envFile AND two envs', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'env',
      string: 'HELLO=World',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    },
    {
      type: 'env',
      string: 'HOLA=amigo',
      parsed: {
        HOLA: 'amigo'
      },
      injected: {
        HOLA: 'amigo'
      },
      preExisted: {}
    },
    {
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: ['HELLO=World', 'HOLA=amigo'],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO', 'HOLA']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HELLO=World)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HOLA=amigo)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HOLA set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerDebugStub.calledWith('HOLA set to amigo'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (2) from .env, and --env flags'), 'logger.successv')

  ct.end()
})

t.test('run - env (two strings)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'env',
      string: 'HELLO=World',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    },
    {
      type: 'env',
      string: 'HEY=there',
      parsed: {
        HEY: 'there'
      },
      injected: {
        HEY: 'there'
      },
      preExisted: {}
    }],
    readableStrings: ['HELLO=World', 'HEY=there'],
    readableFilepaths: [],
    uniqueInjectedKeys: ['HELLO', 'HEY']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HELLO=World)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('loading env from string (HEY=there)'), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerVerboseStub.calledWith('HEY set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HEY set to there'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (2) from --env flags'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_ENV_FILE', async ct => {
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.fix = 'fix: [echo "HELLO=World" > .env]'
  error.help = 'fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerErrorStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [echo "HELLO=World" > .env]'), 'logger.error')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_ENV_FILE fallback filepath', async ct => {
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.fix = 'fix: [echo "HELLO=World" > .env]'
  error.help = 'fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(Run.prototype, 'run').returns({
    processedEnvs: [{
      errors: [error],
      type: 'env',
      filepath: undefined,
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })

  await run.call(fakeContext)

  t.ok(loggerErrorStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [echo "HELLO=World" > .env]'), 'logger.error fallback .env path')
  ct.end()
})

t.test('run - MISSING_ENV_FILE with --convention stays quiet', async ct => {
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.help = 'fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({ convention: 'nextjs' })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--convention=nextjs', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerSuccessvStub = sinon.stub(logger, 'successv')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.notOk(loggerErrorStub.called, 'logger.error stays quiet for convention missing env file')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_ENV_FILE --strict flag', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.fix = 'fix: [echo "HELLO=World" > .env]'
  error.help = 'fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({ strict: true })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--strict', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerErrorStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [echo "HELLO=World" > .env]'), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('[MISSING_ENV_FILE]. fix: [echo "HELLO=World" > .env]'), 'does not print separate help line')
  t.notOk(loggerSuccessvStub.called, 'logger.successv')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')

  ct.end()
})

t.test('run - MISSING_ENV_FILE --ignore flag', async ct => {
  const error = new Error('[MISSING_ENV_FILE] missing file (.env)')
  setCode(error, 'MISSING_ENV_FILE')
  error.fix = 'fix: [echo "HELLO=World" > .env]'
  error.help = 'fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({ ignore: ['MISSING_ENV_FILE'] })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--ignore=MISSING_ENV_FILE', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerErrorStub.notCalled, 'logger.error')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_ENV_FILE --strict flag and MISSING_ENV_FILE --ignore flag', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const error = new Error('Mock Error')
  setCode(error, 'MISSING_ENV_FILE')
  error.help = '[MISSING_ENV_FILE]. fix: [echo "HELLO=World" > .env]'
  const optsStub = sinon.stub().returns({ strict: true, ignore: ['MISSING_ENV_FILE'] })
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--strict', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  ct.ok(stub.called, 'new Run().run() called')
  ct.ok(loggerErrorStub.notCalled, 'logger.error')
  ct.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  ct.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')
  ct.ok(processExitStub.notCalled, 'process.exit should NOT be called')

  ct.end()
})

t.test('run - OTHER_ERROR', async ct => {
  const error = new Error('Mock Error')
  setCode(error, 'OTHER_ERROR')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - WRONG_PRIVATE_KEY', async ct => {
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  setCode(error, 'WRONG_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error one-line')
  t.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'logger.error does not print separate help line')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_PRIVATE_KEY', async ct => {
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  setCode(error, 'MISSING_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      errors: [error],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error one-line')
  t.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'logger.error does not print separate help line')
  t.ok(loggerSuccessvStub.calledWith('injected env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - preserves punctuated private key messages', async ct => {
  const wrongError = new Error('[WRONG_PRIVATE_KEY] punctuated')
  setCode(wrongError, 'WRONG_PRIVATE_KEY')
  const missingError = new Error('[MISSING_PRIVATE_KEY] punctuated')
  setCode(missingError, 'MISSING_PRIVATE_KEY')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const loggerErrorStub = sinon.stub(logger, 'error')
  sinon.stub(Run.prototype, 'run').returns({
    processedEnvs: [{
      errors: [wrongError, missingError],
      type: 'envFile',
      filepath: '.env',
      parsed: {},
      injected: {},
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: [],
    uniqueInjectedKeys: []
  })

  await run.call(fakeContext)

  t.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  t.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  ct.end()
})

t.test('run - envFile (prexists)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {},
      preExisted: {
        HELLO: 'World'
      }
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO pre-exists (protip: use --overload to override)'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO pre-exists as World (protip: use --overload to override)'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')

  ct.end()
})

t.test('run - throws error', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.messageWithHelp = 'Mock Error'

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.throws(error)
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')
  t.notOk(loggerErrorStub.calledWith('Mock Help'), 'logger.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - throws WRONG_PRIVATE_KEY', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  setCode(error, 'WRONG_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.throws(error)
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger.error one-line')
  t.notOk(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/466'), 'logger.error does not print separate help line')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - throws MISSING_PRIVATE_KEY', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  setCode(error, 'MISSING_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.throws(error)
  const loggerErrorStub = sinon.stub(logger, 'error')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger.error one-line')
  t.notOk(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] https://github.com/dotenvx/dotenvx/issues/464'), 'logger.error does not print separate help line')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - throws punctuated private key errors', async ct => {
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])

  const wrongError = new Error('[WRONG_PRIVATE_KEY] punctuated')
  setCode(wrongError, 'WRONG_PRIVATE_KEY')
  sinon.stub(Run.prototype, 'run').throws(wrongError)
  await run.call(fakeContext)
  t.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))

  Run.prototype.run.restore()
  const missingError = new Error('[MISSING_PRIVATE_KEY] punctuated')
  setCode(missingError, 'MISSING_PRIVATE_KEY')
  sinon.stub(Run.prototype, 'run').throws(missingError)
  await run.call(fakeContext)
  t.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] punctuated. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))

  t.ok(processExitStub.calledWith(1), 'process.exit(1)')
  ct.end()
})

t.test('run - envFile (missing command arguments after --)', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: [], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--'])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')
  t.ok(loggerErrorStub.calledWith('missing command after [dotenvx run --]. try [dotenvx run -- yourcommand]'), 'logger.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - envFile (ambiguous arguments, missing --)', async ct => {
  const optsStub = sinon.stub().returns({ envFile: ['.env.production'] })
  const fakeContext = { opts: optsStub, args: [], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '-f', '.env.production', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')

  t.ok(loggerErrorStub.calledWith('ambiguous command due to missing \'--\' separator. try [dotenvx run -f .env.production -- yourcommand]'), 'logger.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - envFile (ambiguous arguments, missing -- and envFile is empty)', async ct => {
  const optsStub = sinon.stub().returns({ envFile: [] })
  const fakeContext = { opts: optsStub, args: [], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '-f', '.env', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injected env (1) from .env'), 'logger.successv')

  t.ok(loggerErrorStub.calledWith('ambiguous command due to missing \'--\' separator. try [dotenvx run -f .env -- yourcommand]'), 'logger.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - envFile - parsed, injected, and preExisted missing for some reason upstream - it doesn\'t choke', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envFile',
      filepath: '.env'
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: []
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerSuccessvStub.calledWith('injected env (0) from .env'), 'logger.successv')

  ct.end()
})
