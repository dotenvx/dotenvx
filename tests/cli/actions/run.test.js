const t = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Run = require('./../../../src/lib/services/run')
const { logger } = require('../../../src/shared/logger')

const run = proxyquire('../../../src/cli/actions/run', {
  '../../../src/lib/helpers/executeCommand': async () => true
})

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (0)'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - DOTENV_KEY', async ct => {
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
  const loggerWarnStub = sinon.stub(logger, 'warn')
  process.env.DOTENV_KEY = 'vlt_1234'

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerSuccessvStub.calledWith('injecting env (0)'), 'logger.successv')
  t.ok(loggerWarnStub.calledWith('DEPRECATION NOTICE: Setting DOTENV_KEY with .env.vault is deprecated.'), 'logger.warn')
  t.ok(loggerWarnStub.calledWith('DEPRECATION NOTICE: Run [dotenvx ext vault migrate] for instructions on converting your .env.vault file to encrypted .env files (using public key encryption algorithm secp256k1)'), 'logger.warn')
  t.ok(loggerWarnStub.calledWith('DEPRECATION NOTICE: Read more at [https://github.com/dotenvx/dotenvx/blob/main/CHANGELOG.md#0380]'), 'logger.warn')

  ct.end()
})

t.test('run - envVaultFile', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      type: 'envVaultFile',
      filepath: '.env.vault',
      parsed: {
        HELLO: 'World'
      },
      injected: {
        HELLO: 'World'
      },
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env.vault'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from encrypted .env.vault (${path.resolve('.env.vault')})`), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith(`decrypting encrypted env from .env.vault (${path.resolve('.env.vault')})`), 'logger.debug')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env.vault'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')

  ct.end()
})

t.test('run - envFile (with warnings)', async ct => {
  const warning = new Error('[DECRYPTION_FAILED] could not decrypt HELLO using private key d607fff…')
  warning.code = 'DECRYPTION_FAILED'
  warning.help = '[DECRYPTION_FAILED] ? encrypted data looks malformed'

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
      warnings: [warning],
      preExisted: {}
    }],
    readableStrings: [],
    readableFilepaths: ['.env'],
    uniqueInjectedKeys: ['HELLO']
  })
  const loggerSuccessvStub = sinon.stub(logger, 'successv')
  const loggerVerboseStub = sinon.stub(logger, 'verbose')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerWarnStub.calledWith('[DECRYPTION_FAILED] could not decrypt HELLO using private key d607fff…'), 'logger.warn')
  t.ok(loggerHelpStub.calledWith('[DECRYPTION_FAILED] ? encrypted data looks malformed'), 'logger.help')
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from --env flag'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env, and --env flag'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (2) from .env, and --env flags'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (2) from --env flags'), 'logger.successv')

  ct.end()
})

t.test('run - MISSING_ENV_FILE', async ct => {
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      error,
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
  const loggerWarnvStub = sinon.stub(logger, 'warnv')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerWarnvStub.calledWith('Mock Error'), 'logger.warnv')
  t.ok(loggerHelpStub.calledWith('? add one with [echo "HELLO=World" > .env] and re-run [dotenvx run -- echo ]'), 'logger.help')
  t.ok(loggerSuccessvStub.calledWith('injecting env (0)'), 'logger.successv')

  ct.end()
})

t.test('run - OTHER_ERROR', async ct => {
  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.returns({
    processedEnvs: [{
      error,
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
  const loggerWarnvStub = sinon.stub(logger, 'warnv')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerWarnvStub.calledWith('Mock Error'), 'logger.warnv')
  t.ok(loggerHelpStub.notCalled, 'logger.help')
  t.ok(loggerSuccessvStub.calledWith('injecting env (0)'), 'logger.successv')

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
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')

  ct.end()
})

t.test('run - throws error', async ct => {
  const error = new Error('Mock Error')
  error.help = 'Mock Help'

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub, args: ['echo', ''], envs: [] }
  sinon.stub(process, 'argv').value(['node', 'dotenvx', 'run', '--', 'echo', ''])
  const stub = sinon.stub(Run.prototype, 'run')
  stub.throws(error)
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerHelpStub.calledWith('Mock Help'), 'logger.help')
  t.ok(loggerErrorStub.calledWith('Mock Error'), 'logger.error')

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
  const consoleErrorStub = sinon.stub(console, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')
  t.ok(consoleErrorStub.calledWith('missing command after [dotenvx run --]. try [dotenvx run -- yourcommand]'), 'console.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - envFile (ambigious arguments, missing --)', async ct => {
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
  const consoleErrorStub = sinon.stub(console, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')

  t.ok(consoleErrorStub.calledWith('ambiguous command due to missing \'--\' separator. try [dotenvx run -f .env.production -- yourcommand]'), 'console.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})

t.test('run - envFile (ambigious arguments, missing -- and envFile is empty)', async ct => {
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
  const consoleErrorStub = sinon.stub(console, 'error')
  const processExitStub = sinon.stub(process, 'exit')

  await run.call(fakeContext)

  t.ok(stub.called, 'new Run().run() called')
  t.ok(loggerVerboseStub.calledWith(`loading env from .env (${path.resolve('.env')})`), 'logger.verbose')
  t.ok(loggerVerboseStub.calledWith('HELLO set'), 'logger.verbose')
  t.ok(loggerDebugStub.calledWith('HELLO set to World'), 'logger.debug')
  t.ok(loggerSuccessvStub.calledWith('injecting env (1) from .env'), 'logger.successv')

  t.ok(consoleErrorStub.calledWith('ambiguous command due to missing \'--\' separator. try [dotenvx run -f .env -- yourcommand]'), 'console.error')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})
