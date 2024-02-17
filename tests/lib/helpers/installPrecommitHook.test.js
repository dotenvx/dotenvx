const t = require('tap')
const fs = require('fs')
const sinon = require('sinon')
const chalk = require('chalk')
const capcon = require('capture-console')

const packageJson = require('../../../src/shared/packageJson')

const InstallPrecommitHook = require('../../../src/lib/helpers/installPrecommitHook')

t.test('#run (exists and already includes dotenvx precommit) does nothing', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const currentHookStub = sinon.stub(installPrecommitHook, '_currentHook')

  existsStub.returns(true)
  currentHookStub.returns('dotenvx precommit')

  const stdout = capcon.interceptStdout(() => {
    installPrecommitHook.run()
  })

  ct.equal(stdout, `${chalk.keyword('orangered')(`[dotenvx@${packageJson.version}][precommit] dotenvx precommit exists [.git/hooks/pre-commit]`)}\n`)

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

  const stdout = capcon.interceptStdout(() => {
    installPrecommitHook.run()
  })

  ct.equal(stdout, `${chalk.keyword('green')(`[dotenvx@${packageJson.version}][precommit] dotenvx precommit appended [.git/hooks/pre-commit]`)}\n`)
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

  existsStub.returns(false)

  const stdout = capcon.interceptStdout(() => {
    installPrecommitHook.run()
  })

  ct.equal(stdout, `${chalk.keyword('green')(`[dotenvx@${packageJson.version}][precommit] dotenvx precommit installed [.git/hooks/pre-commit]`)}\n`)
  t.ok(writeFileSyncStub.called, 'fs.writeFileSync should be called')

  // restore stubs
  existsStub.restore()
  writeFileSyncStub.restore()

  ct.end()
})

t.test('#run (fs throws an error) logs error', ct => {
  const installPrecommitHook = new InstallPrecommitHook()

  const existsStub = sinon.stub(installPrecommitHook, '_exists')
  const writeFileSyncStub = sinon.stub(fs, 'writeFileSync').throws(new Error('Mock Error'))

  existsStub.returns(false)

  const stdout = capcon.interceptStdout(() => {
    installPrecommitHook.run()
  })

  ct.equal(stdout, `${chalk.bold.red(`[dotenvx@${packageJson.version}][precommit] failed to modify pre-commit hook: Mock Error`)}\n`)

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
