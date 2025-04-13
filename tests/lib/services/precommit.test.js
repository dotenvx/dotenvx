const t = require('tap')
const fsx = require('../../../src/lib/helpers/fsx')
const sinon = require('sinon')
const childProcess = require('child_process')

const Precommit = require('../../../src/lib/services/precommit')
const InstallPrecommitHook = require('../../../src/lib/helpers/installPrecommitHook')
const packageJson = require('../../../src/lib/helpers/packageJson')
const Ls = require('../../../src/lib/services/ls')

const originalExecSync = childProcess.execSync

const prefix = `[dotenvx@${packageJson.version}][precommit]`

t.beforeEach((ct) => {
  sinon.restore()
  childProcess.execSync = sinon.stub()
})

t.afterEach((ct) => {
  childProcess.execSync = originalExecSync // restore the original execSync after each test
})

t.test('#run', ct => {
  sinon.stub(Ls.prototype, 'run').returns([])
  const precommit = new Precommit()
  const installPrecommitHookStub = sinon.stub(precommit, '_installPrecommitHook')

  precommit.run()

  t.ok(installPrecommitHookStub.notCalled, '_installPrecommitHook should not be called')

  ct.end()
})

t.test('#run (install: true)', ct => {
  const precommit = new Precommit({ install: true })
  const installPrecommitHookStub = sinon.stub(precommit, '_installPrecommitHook')
  installPrecommitHookStub.returns({ successMessage: 'success' })

  precommit.run()

  t.ok(installPrecommitHookStub.called, '_installPrecommitHook should be called')

  ct.end()
})

t.test('#run (no gitignore file)', ct => {
  sinon.stub(fsx, 'existsSync').returns(false)
  sinon.stub(Ls.prototype, 'run').returns([])

  const { warnings } = new Precommit().run()
  ct.same(warnings[0].message, `${prefix} .gitignore missing`)

  ct.end()
})

t.test('#run (gitignore is ignoring .env.example file and shouldn\'t)', ct => {
  sinon.stub(fsx, 'readFileX').returns('.env*')
  sinon.stub(fsx, 'readdirSync').returns(['.env.example'])
  sinon.stub(Ls.prototype, 'run').returns(['.env.example'])
  childProcess.execSync.returns(Buffer.from('.env.example'))

  const { warnings } = new Precommit().run()

  ct.same(warnings[0].message, `${prefix} .env.example (currently ignored but should not be)`)

  ct.end()
})

t.test('#run (gitignore is ignoring .env.vault file and shouldn\'t)', ct => {
  sinon.stub(fsx, 'readFileX').returns('.env*')
  sinon.stub(fsx, 'readdirSync').returns(['.env.vault'])
  sinon.stub(Ls.prototype, 'run').returns(['.env.vault'])
  childProcess.execSync.returns(Buffer.from('.env.vault'))

  const { warnings } = new Precommit().run()
  ct.same(warnings[0].message, `${prefix} .env.vault (currently ignored but should not be)`)

  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should)', ct => {
  sinon.stub(Ls.prototype, 'run').returns(['.env.production'])
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
    ct.same(error.message, `${prefix} .env.production not protected (encrypted or gitignored)`)
  }

  ct.end()
})

t.test('#run (gitignore is not ignore .env.keys file and should)', ct => {
  sinon.stub(Ls.prototype, 'run').returns(['.env.keys'])
  childProcess.execSync.returns(Buffer.from('.env.keys'))
  const readFileXStub = sinon.stub(fsx, 'readFileX')
  // Stub different return values based on the file path
  readFileXStub.callsFake((filePath) => {
    if (filePath === '.env') {
      return '.env'
    } else if (filePath === '.env.keys') {
      return 'DOTENV_PRIVATE_KEY=value'
    }
    return ''
  })

  try {
    new Precommit().run()
    ct.fail('should have raised an error but did not')
  } catch (error) {
    ct.same(error.message, `${prefix} .env.keys not protected (gitignored)`)
  }

  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should) AND isFileToBeCommited raises an error (should default to true on the filename)', ct => {
  sinon.stub(Ls.prototype, 'run').returns(['.env.production'])
  sinon.stub(Precommit.prototype, '_isInGitRepo').returns(true)
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
    ct.same(error.message, `${prefix} .env.production not protected (encrypted or gitignored)`)
  }

  ct.end()
})

t.test('#run (gitignore is not ignore .env.production file and should) AND isInGitRepo raises an error (should default to true on the filename)', ct => {
  sinon.stub(Ls.prototype, 'run').returns(['.env.production'])
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
    ct.same(error.message, `${prefix} .env.production not protected (encrypted or gitignored)`)
  }

  ct.end()
})

t.test('#run (.env files in subfolders throw error in precommit hook)', ct => {
  sinon.stub(Ls.prototype, 'run').returns(['packages/app/.env.production'])
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
    ct.same(error.message, `${prefix} packages/app/.env.production not protected (encrypted or gitignored)`)
  }

  ct.end()
})

t.test('_installPrecommitHook calls InstallPrecommitHook.run', ct => {
  const stub = sinon.stub(InstallPrecommitHook.prototype, 'run').returns({})

  const precommit = new Precommit()
  precommit._installPrecommitHook()

  t.ok(stub.called, 'new InstallPrecommitHook().run() called')

  ct.end()
})
