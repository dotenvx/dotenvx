const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')

const InstallPrecommitHook = require('../../../src/lib/helpers/installPrecommitHook')

t.test('#run (exists and already includes dotenvx precommit) does nothing', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const currentHookStub = sinon.stub(installPrecommitHook, '_currentHook')

  existsStub.returns(true)
  currentHookStub.returns('dotenvx precommit')

  const { successMessage } = installPrecommitHook.run()

  ct.same(successMessage, 'dotenvx precommit exists [.git/hooks/pre-commit]')

  // restore stubs
  existsStub.restore()
  currentHookStub.restore()

  ct.end()
})

t.test('#run (exists but does not include dotenvx precommit) appends', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const currentHookStub = sinon.stub(installPrecommitHook, '_currentHook')
  const appendFileSyncStub = sinon.stub(fs, 'appendFileSync')

  existsStub.returns(true)
  currentHookStub.returns('') // empty file

  const { successMessage } = installPrecommitHook.run()

  ct.same(successMessage, 'dotenvx precommit appended [.git/hooks/pre-commit]')

  t.ok(appendFileSyncStub.called, 'fs.appendFileSync should be called')

  // restore stubs
  existsStub.restore()
  currentHookStub.restore()
  appendFileSyncStub.restore()

  ct.end()
})

t.test('#run (does not exist) creates', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
  const chmodSyncStub = sinon.stub(fs, 'chmodSync')

  existsStub.returns(false)

  const { successMessage } = installPrecommitHook.run()

  ct.same(successMessage, 'dotenvx precommit installed [.git/hooks/pre-commit]')

  t.ok(writeFileSyncStub.called, 'fs.writeFileSync should be called')
  t.ok(chmodSyncStub.called, 'fs.chomdSyncStub should be called')

  // restore stubs
  existsStub.restore()
  writeFileSyncStub.restore()
  chmodSyncStub.restore()

  ct.end()
})

t.test('#run (fs throws an error) logs error', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync').throws(new Error('Mock Error'))

  existsStub.returns(false)

  try {
    installPrecommitHook.run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'failed to modify pre-commit hook: Mock Error')
  }

  // restore stubs
  existsStub.restore()
  writeFileSyncStub.restore()

  ct.end()
})

t.test('#_exists true/false', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsSyncStub = sinon.stub(fs, 'existsSync')

  existsSyncStub.returns(false)
  let result = installPrecommitHook._exists()
  ct.equal(result, false)

  existsSyncStub.returns(true)
  result = installPrecommitHook._exists()
  ct.equal(result, true)

  existsSyncStub.restore()

  ct.end()
})

t.test('#_currentHook', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const readFileSyncStub = sinon.stub(fs, 'readFileSync')

  readFileSyncStub.returns('some file')
  const result = installPrecommitHook._currentHook()
  ct.equal(result, 'some file')

  readFileSyncStub.restore()

  ct.end()
})
