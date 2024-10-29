const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const childProcess = require('child_process')

const Precommit = require('../../../src/lib/services/precommit')
const InstallPrecommitHook = require('../../../src/lib/helpers/installPrecommitHook')
const Ls = require('../../../src/lib/services/ls')

const originalExecSync = childProcess.execSync

t.beforeEach((ct) => {
  sinon.restore()
  childProcess.execSync = sinon.stub()
})

t.afterEach((ct) => {
  childProcess.execSync = originalExecSync // restore the original execSync after each test
})

t.test('#run', ct => {
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns([])
  const precommit = new Precommit()
  const installPrecommitHookStub = sinon.stub(precommit, '_installPrecommitHook')

  precommit.run()

  t.ok(installPrecommitHookStub.notCalled, '_installPrecommitHook should not be called')

  installPrecommitHookStub.restore()
  lsServiceStub.restore()
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
  const existsSyncStub = sinon.stub(fsx, 'existsSync')
  existsSyncStub.returns(false)
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns([])

  const { warnings } = new Precommit().run()
  ct.same(warnings[0].message, '.gitignore missing')

  existsSyncStub.restore()
  lsServiceStub.restore()
  ct.end()
})

t.test('#run (gitignore is ignoring .env.example file and shouldn\'t)', ct => {
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  readFileXStub.returns('.env*')
  const readdirSyncStub = sinon.stub(fsx, 'readdirSync')
  readdirSyncStub.returns(['.env.example'])
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns(['.env.example'])
  childProcess.execSync.returns(Buffer.from('.env.example'))

  const { warnings } = new Precommit().run()

  ct.same(warnings[0].message, '.env.example (currently ignored but should not be)')

  readFileXStub.restore()
  readdirSyncStub.restore()
  lsServiceStub.restore()
  ct.end()
})

t.test('#run (gitignore is ignoring .env.vault file and shouldn\'t)', ct => {
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  readFileXStub.returns('.env*')
  const readdirSyncStub = sinon.stub(fsx, 'readdirSync')
  readdirSyncStub.returns(['.env.vault'])
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns(['.env.vault'])
  childProcess.execSync.returns(Buffer.from('.env.vault'))

  const { warnings } = new Precommit().run()
  ct.same(warnings[0].message, '.env.vault (currently ignored but should not be)')

  readFileXStub.restore()
  readdirSyncStub.restore()
  lsServiceStub.restore()
  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should)', ct => {
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns(['.env.production'])
  childProcess.execSync.returns(Buffer.from('.env.production'))
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  // Stub different return values based on the file path
  readFileXStub.callsFake((filePath) => {
    if (filePath === '.env') {
      return '.env'
    } else if (filePath === '.env.production') {
      return 'ENV_VAR=value'
    }
    return ''
  })

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, '.env.production not protected (encrypted or gitignored)')
  }

  readFileXStub.restore()
  lsServiceStub.restore()
  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should) AND isFileToBeCommited raises an error (should default to true on the filename)', ct => {
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns(['.env.production'])
  childProcess.execSync.throws(new Error('Mock Error'))
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  // Stub different return values based on the file path
  readFileXStub.callsFake((filePath) => {
    if (filePath === '.env') {
      return '.env'
    } else if (filePath === '.env.production') {
      return 'ENV_VAR=value'
    }
    return ''
  })

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, '.env.production not protected (encrypted or gitignored)')
  }

  readFileXStub.restore()
  lsServiceStub.restore()
  ct.end()
})

t.test('#run (.env files in subfolders throw error in precommit hook)', ct => {
  const lsServiceStub = sinon.stub(Ls.prototype, 'run')
  lsServiceStub.returns(['packages/app/.env.production'])
  childProcess.execSync.returns(Buffer.from('packages/app/.env.production'))

  const readFileXStub = sinon.stub(fsx, 'readFileX')
  readFileXStub.callsFake((filePath) => {
    if (filePath === 'packages/app/.env.production') {
      return 'ENV_VAR=value'
    }
    return ''
  })

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, 'packages/app/.env.production not protected (encrypted or gitignored)')
  }

  lsServiceStub.restore()
  readFileXStub.restore()
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
