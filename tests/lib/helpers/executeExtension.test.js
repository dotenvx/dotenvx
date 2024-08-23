const t = require('tap')
const sinon = require('sinon')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

const executeExtension = require('../../../src/lib/helpers/executeExtension')

const ext = {
  outputHelp: sinon.stub()
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('executeExtension - no command', ct => {
  const processExitStub = sinon.stub(process, 'exit')

  executeExtension(ext, undefined, [])

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')

  ct.end()
})

t.test('executeExtension - vault command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  executeExtension(ext, 'vault', ['vault'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerWarnStub.calledWith('[INSTALLATION_NEEDED] install dotenvx-ext-vault to use [dotenvx ext vault] commands'), 'warn')
  ct.ok(loggerHelpStub.calledWith('? see installation instructions [https://github.com/dotenvx/dotenvx-ext-vault]'), 'help')

  ct.end()
})

t.test('executeExtension - other command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')
  const loggerInfoStub = sinon.stub(logger, 'info')

  executeExtension(ext, 'other', ['other'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')
  ct.ok(loggerInfoStub.calledWith('error: unknown command \'other\''), 'info')

  ct.end()
})

t.test('executeExtension - vault found', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 0
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  executeExtension(ext, 'vault', ['vault'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')

  ct.end()
})
