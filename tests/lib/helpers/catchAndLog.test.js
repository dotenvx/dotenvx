const t = require('tap')
const sinon = require('sinon')

const { logger } = require('../../../src/shared/logger')
const Errors = require('../../../src/lib/helpers/errors')
const catchAndLog = require('../../../src/lib/helpers/catchAndLog')

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
})

t.test('catchAndLog - WRONG_PRIVATE_KEY', (ct) => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const error = new Error("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'")
  setCode(error, 'WRONG_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/466]'
  error.debug = 'debug details'

  catchAndLog(error)

  ct.ok(loggerErrorStub.calledWith("[WRONG_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY=199bdd6…'. fix: [https://github.com/dotenvx/dotenvx/issues/466]"))
  ct.notOk(loggerHelpStub.called, 'does not emit separate help line')
  ct.ok(loggerDebugStub.calledWith('debug details'))
  ct.ok(loggerDebugStub.calledWith('ERROR_CODE: WRONG_PRIVATE_KEY'))
  ct.end()
})

t.test('catchAndLog - MISSING_PRIVATE_KEY', (ct) => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const error = new Error("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='")
  setCode(error, 'MISSING_PRIVATE_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/464]'

  catchAndLog(error)

  ct.ok(loggerErrorStub.calledWith("[MISSING_PRIVATE_KEY] could not decrypt HELLO using private key 'DOTENV_PRIVATE_KEY='. fix: [https://github.com/dotenvx/dotenvx/issues/464]"))
  ct.notOk(loggerHelpStub.called, 'does not emit separate help line')
  ct.end()
})

t.test('catchAndLog - INVALID_PUBLIC_KEY', (ct) => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const error = new Error("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'")
  setCode(error, 'INVALID_PUBLIC_KEY')
  error.help = 'fix: [https://github.com/dotenvx/dotenvx/issues/756]'

  catchAndLog(error)

  ct.ok(loggerErrorStub.calledWith("[INVALID_PUBLIC_KEY] could not encrypt using public key 'DOTENV_PUBLIC_KEY=10248e9…'. fix: [https://github.com/dotenvx/dotenvx/issues/756]"))
  ct.notOk(loggerHelpStub.called, 'does not emit separate help line')
  ct.end()
})

t.test('catchAndLog - other error with help/debug', (ct) => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const error = new Error('boom')
  error.code = 'OTHER_ERROR'
  error.help = 'help text'
  error.messageWithHelp = 'boom'
  error.debug = 'debug text'

  catchAndLog(error)

  ct.ok(loggerErrorStub.calledWith('boom'))
  ct.notOk(loggerHelpStub.calledWith('help text'))
  ct.ok(loggerDebugStub.calledWith('debug text'))
  ct.ok(loggerDebugStub.calledWith('ERROR_CODE: OTHER_ERROR'))
  ct.end()
})

t.test('catchAndLog keeps trailing periods', (ct) => {
  const loggerErrorStub = sinon.stub(logger, 'error')
  const loggerHelpStub = sinon.stub(logger, 'help')

  const wrongPrivateKey = new Error("[WRONG_PRIVATE_KEY] could not decrypt")
  setCode(wrongPrivateKey, 'WRONG_PRIVATE_KEY')
  catchAndLog(wrongPrivateKey)

  const missingPrivateKey = new Error('[MISSING_PRIVATE_KEY] could not decrypt')
  setCode(missingPrivateKey, 'MISSING_PRIVATE_KEY')
  catchAndLog(missingPrivateKey)

  const invalidPublicKey = new Error('[INVALID_PUBLIC_KEY] could not encrypt')
  setCode(invalidPublicKey, 'INVALID_PUBLIC_KEY')
  catchAndLog(invalidPublicKey)

  ct.ok(loggerErrorStub.calledWith('[WRONG_PRIVATE_KEY] could not decrypt. fix: [https://github.com/dotenvx/dotenvx/issues/466]'))
  ct.ok(loggerErrorStub.calledWith('[MISSING_PRIVATE_KEY] could not decrypt. fix: [https://github.com/dotenvx/dotenvx/issues/464]'))
  ct.ok(loggerErrorStub.calledWith('[INVALID_PUBLIC_KEY] could not encrypt. fix: [https://github.com/dotenvx/dotenvx/issues/756]'))
  ct.notOk(loggerHelpStub.called)
  ct.end()
})
