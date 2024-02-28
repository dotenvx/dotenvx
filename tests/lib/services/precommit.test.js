const t = require('tap')
const sinon = require('sinon')

const Precommit = require('../../../src/lib/services/precommit')

t.test('#run', ct => {
  const precommit = new Precommit()
  const installPrecommitHookStub = sinon.stub(precommit, '_installPrecommitHook')

  precommit.run()

  t.ok(installPrecommitHookStub.notCalled, '_installPrecommitHook should not be called')

  installPrecommitHookStub.restore()

  ct.end()
})

t.test('#run (install: true)', ct => {
  const precommit = new Precommit({ install: true })
  const installPrecommitHookStub = sinon.stub(precommit, '_installPrecommitHook')
  installPrecommitHookStub.returns({ successMessage: 'success' })

  precommit.run()

  t.ok(installPrecommitHookStub.called, '_installPrecommitHook should be called')

  installPrecommitHookStub.restore()

  ct.end()
})
