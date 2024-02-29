const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const Precommit = require('../../../src/lib/services/precommit')
const InstallPrecommitHook = require('../../../src/lib/helpers/installPrecommitHook')

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

t.test('#run (no gitignore file)', ct => {
  const existsSyncStub = sinon.stub(fs, 'existsSync')
  existsSyncStub.returns(false)

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, '.gitignore missing')
  }

  existsSyncStub.restore()
  ct.end()
})

t.test('#run (gitignore is ignoring .env.example file and shouldn\'t)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.returns('.env*')
  const readdirSyncStub = sinon.stub(fs, 'readdirSync')
  readdirSyncStub.returns(['.env.example'])

  const { warnings } = new Precommit().run()

  ct.same(warnings[0].message, '.env.example (currently ignored but should not be)')

  readFileSyncStub.restore()
  readdirSyncStub.restore()
  ct.end()
})

t.test('#run (gitignore is ignoring .env.vault file and shouldn\'t)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.returns('.env*')
  const readdirSyncStub = sinon.stub(fs, 'readdirSync')
  readdirSyncStub.returns(['.env.vault'])

  const { warnings } = new Precommit().run()

  ct.same(warnings[0].message, '.env.vault (currently ignored but should not be)')

  readFileSyncStub.restore()
  readdirSyncStub.restore()
  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should)', ct => {
  const readFileSyncStub = sinon.stub(fs, 'readFileSync')
  readFileSyncStub.returns('.env')
  const readdirSyncStub = sinon.stub(fs, 'readdirSync')
  readdirSyncStub.returns(['.env.production'])

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, '.env.production not properly gitignored')
  }

  readFileSyncStub.restore()
  readdirSyncStub.restore()
  ct.end()
})

t.test('_installPrecommitHook calls InstallPrecommitHook.run', ct => {
  const stub = sinon.stub(InstallPrecommitHook.prototype, 'run')
  stub.returns({})

  const precommit = new Precommit()
  precommit._installPrecommitHook()

  t.ok(stub.called, 'new InstallPrecommitHook().run() called')

  stub.restore()

  ct.end()
})
