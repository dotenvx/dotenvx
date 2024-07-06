const t = require('tap')
const sinon = require('sinon')

const { logger } = require('../../../../../src/shared/logger')

const migrate = require('../../../../../src/cli/actions/ext/vault/migrate')

const optsStub = sinon.stub().returns({})
const fakeContext = { opts: optsStub }

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('migrate', ct => {
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerHelp2Stub = sinon.stub(logger, 'help2')
  const loggerSuccessStub = sinon.stub(logger, 'success')

  migrate.call(fakeContext, '.')

  ct.ok(loggerHelpStub.called, 'help called')
  ct.ok(loggerHelp2Stub.called, 'help2 called')
  ct.ok(loggerSuccessStub.called, 'success called')

  ct.end()
})
