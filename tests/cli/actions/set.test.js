const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

const Sets = require('../../../src/lib/services/sets')
const { logger } = require('../../../src/shared/logger')

const set = proxyquire('../../../src/cli/actions/set', {
  '../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
})

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('set - no changes', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerNeutralStub = sinon.stub(logger, 'info')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')

  ct.end()
})

t.test('set - --no-create passes through to service', async ct => {
  let constructorArgs

  class SetsMock {
    constructor (...args) {
      constructorArgs = args
    }

    run () {
      return {
        processedEnvs: [],
        changedFilepaths: [],
        unchangedFilepaths: []
      }
    }
  }

  const setWithMock = proxyquire('../../../src/cli/actions/set', {
    './../../lib/services/sets': SetsMock,
    '../../../src/lib/helpers/isIgnoringDotenvKeys': () => true
  })

  const optsStub = sinon.stub().returns({ create: false })
  const fakeContext = { opts: optsStub, envs: [] }

  await setWithMock.call(fakeContext, 'HELLO', 'World')

  t.equal(constructorArgs[6], true, 'noCreate=true when --no-create is set')

  ct.end()
})

t.test('set - changes', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env)'), 'logger success')

  ct.end()
})

t.test('set - no changes and no unchanged', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })
  const loggerInfoStub = sinon.stub(logger, 'info')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')

  ct.end()
})

t.test('set - MISSING_ENV_FILE', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().main() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger help')

  ct.end()
})

t.test('set - MISSING_ENV_FILE fallback filepath', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error('Mock Error')
  error.code = 'MISSING_ENV_FILE'
  error.messageWithHelp = '[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'
  const loggerWarnStub = sinon.stub(logger, 'warn')
  sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: undefined,
      envFilepath: undefined,
      envSrc: '',
      privateKeyAdded: false,
      privateKeyName: null,
      privateKey: null,
      error
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(loggerWarnStub.calledWith('[MISSING_ENV_FILE] missing file (.env). fix: [https://github.com/dotenvx/dotenvx/issues/484]'), 'logger warn fallback .env path')
  ct.end()
})

t.test('set - OTHER_ERROR', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error('Mock Error')
  error.code = 'OTHER_ERROR'
  error.help = 'some help'
  error.messageWithHelp = 'Mock Error'

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith('Mock Error'), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('set - MISPAIRED_PRIVATE_KEY', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…)")
  error.code = 'MISPAIRED_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/752]'
  error.messageWithHelp = "[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…). fix: [https://github.com/dotenvx/dotenvx/issues/752]"

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith("[MISPAIRED_PRIVATE_KEY] private key's derived public key (03a8ed4…) does not match the existing public key (10248e9…). fix: [https://github.com/dotenvx/dotenvx/issues/752]"), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('set - WRONG_PRIVATE_KEY', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  error.code = 'WRONG_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  error.messageWithHelp = "[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('set - MISSING_PRIVATE_KEY', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  error.code = 'MISSING_PRIVATE_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'
  error.messageWithHelp = "[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('set - INVALID_PUBLIC_KEY', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const error = new Error("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'")
  error.code = 'INVALID_PUBLIC_KEY'
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/756]'
  error.messageWithHelp = "[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"

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
  const loggerNeutralStub = sinon.stub(logger, 'info')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerNeutralStub.calledWith('○ no changes (.env)'), 'logger info')
  t.ok(loggerWarnStub.calledWith("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"), 'logger warn')
  t.ok(loggerHelpStub.notCalled, 'logger.help')

  ct.end()
})

t.test('set - preserves already punctuated error messages', async ct => {
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const loggerWarnStub = sinon.stub(logger, 'warn')
  sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [{
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: '',
      privateKeyAdded: false,
      error: { code: 'WRONG_PRIVATE_KEY', message: '[WRONG_PRIVATE_KEY] already punctuated', messageWithHelp: '[WRONG_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/466]' }
    }, {
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: '',
      privateKeyAdded: false,
      error: { code: 'MISSING_PRIVATE_KEY', message: '[MISSING_PRIVATE_KEY] already punctuated', messageWithHelp: '[MISSING_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/464]' }
    }, {
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: '',
      privateKeyAdded: false,
      error: { code: 'INVALID_PUBLIC_KEY', message: '[INVALID_PUBLIC_KEY] already punctuated', messageWithHelp: '[INVALID_PUBLIC_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/756]' }
    }, {
      key: 'HELLO',
      value: 'World',
      filepath: '.env',
      envFilepath: '.env',
      envSrc: '',
      privateKeyAdded: false,
      error: { code: 'MISPAIRED_PRIVATE_KEY', message: '[MISPAIRED_PRIVATE_KEY] already punctuated', messageWithHelp: '[MISPAIRED_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/752]' }
    }],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(loggerWarnStub.calledWith('[WRONG_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  t.ok(loggerWarnStub.calledWith('[MISSING_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  t.ok(loggerWarnStub.calledWith('[INVALID_PUBLIC_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/756]'))
  t.ok(loggerWarnStub.calledWith('[MISPAIRED_PRIVATE_KEY] already punctuated fix: [https://github.com/dotenvx/dotenvx/issues/752]'))
  ct.end()
})

t.test('set - changes --plain', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({ plain: true })
  const fakeContext = { opts: optsStub }
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
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('◇ set HELLO (.env)'), 'logger success')

  ct.end()
})

t.test('set - privateKeyAdded', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
  t.ok(loggerHelpStub.notCalled, 'logger help')

  ct.end()
})

t.test('set - privateKeyAdded and not ignoring .env.keys', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const setNotIgnoring = proxyquire('../../../src/cli/actions/set', {
    '../../../src/lib/helpers/isIgnoringDotenvKeys': () => false
  })
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerHelpStub = sinon.stub(logger, 'help')

  await setNotIgnoring.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=World'), 'fsx.writeFileX .env')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
  t.ok(loggerHelpStub.notCalled, 'logger help')

  ct.end()
})

t.test('set - privateKeyAdded with unchanged file still reports key addition', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerNeutralStub = sinon.stub(logger, 'info')

  await set.call(fakeContext, 'HELLO', 'dude')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=dude'), 'fsx.writeFileX .env')
  t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
  t.ok(loggerNeutralStub.notCalled, 'logger info')

  ct.end()
})

t.test('set - privateKeyAdded with unchanged file and missing envFilepath falls back to .env', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
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
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerInfoStub = sinon.stub(logger, 'info')

  await set.call(fakeContext, 'HELLO', 'dude')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.calledWith('.env', 'HELLO=dude'), 'fsx.writeFileX .env')
  t.ok(loggerSuccessStub.calledWith('◈ encrypted HELLO (.env) + key (.env.keys)'), 'logger success')
  t.ok(loggerInfoStub.notCalled, 'logger info')

  ct.end()
})

t.test('set - --no-ops passes opsOn false to Sets service', async ct => {
  sinon.stub(fsx, 'writeFileX')
  const optsStub = sinon.stub().returns({ ops: false })
  const fakeContext = { opts: optsStub }
  const runStub = sinon.stub(Sets.prototype, 'run').returns({
    processedEnvs: [],
    changedFilepaths: [],
    unchangedFilepaths: []
  })

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(runStub.calledOnce, 'Sets().run() called')
  t.equal(runStub.thisValues[0].opsOn, false, 'opsOn false')

  ct.end()
})

t.test('set - catch error', async ct => {
  const writeStub = sinon.stub(fsx, 'writeFileX')
  const error = new Error('Mock Error')
  error.help = 'Mock Help'
  error.messageWithHelp = 'Mock Error. Mock Help'
  error.debug = 'Mock Debug'
  error.code = 500

  const optsStub = sinon.stub().returns({})
  const fakeContext = { opts: optsStub }
  const stub = sinon.stub(Sets.prototype, 'run').throws(error)

  const processExitStub = sinon.stub(process, 'exit')
  const loggerInfoStub = sinon.stub(logger, 'info')
  const loggerSuccessStub = sinon.stub(logger, 'success')
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await set.call(fakeContext, 'HELLO', 'World')

  t.ok(stub.called, 'Sets().run() called')
  t.ok(writeStub.notCalled, 'fsx.writeFileX')
  t.ok(loggerInfoStub.notCalled, 'logger info')
  t.ok(loggerSuccessStub.notCalled, 'logger success')
  t.ok(loggerErrorStub.calledWith('Mock Error. Mock Help'), 'logger error')
  t.ok(loggerHelpStub.notCalled, 'logger help')
  t.ok(loggerDebugStub.calledWith('Mock Debug'), 'logger debug')
  t.ok(loggerDebugStub.calledWith('ERROR_CODE: 500'), 'logger debug')
  t.ok(processExitStub.calledWith(1), 'process.exit(1)')

  ct.end()
})
