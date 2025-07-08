const t = require('tap')
const sinon = require('sinon')
const childProcess = require('child_process')

const { logger } = require('../../../src/shared/logger')

const executeDynamic = require('../../../src/lib/helpers/executeDynamic')

const program = {
  outputHelp: sinon.stub()
}

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('executeDynamic - no command', ct => {
  const processExitStub = sinon.stub(process, 'exit')

  executeDynamic(program, undefined, [])

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')

  ct.end()
})

t.test('executeDynamic - pro command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')

  executeDynamic(program, 'pro', ['pro'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')

  ct.end()
})

t.test('executeDynamic - radar command missing', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 1,
    error: new Error('Mock Error')
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const consoleLogStub = sinon.stub(console, 'log')

  executeDynamic(program, 'radar', ['radar'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(consoleLogStub.called, 'console.log')

  ct.end()
})

t.test('executeDynamic - other command missing', ct => {
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

  executeDynamic(program, 'other', ['other'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called with code 1')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')
  ct.ok(loggerInfoStub.calledWith('error: unknown command \'other\''), 'info')

  ct.end()
})

t.test('executeDynamic - pro found', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 0
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  executeDynamic(program, 'pro', ['pro'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')

  ct.end()
})

t.test('executeDynamic - radar found', ct => {
  const spawnSyncStub = sinon.stub(childProcess, 'spawnSync')
  const mockResult = {
    status: 0
  }
  spawnSyncStub.returns(mockResult)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerHelpStub = sinon.stub(logger, 'help')
  const loggerWarnStub = sinon.stub(logger, 'warn')

  executeDynamic(program, 'radar', ['radar'])

  ct.ok(spawnSyncStub.called, 'spawnSync')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')
  ct.ok(loggerWarnStub.notCalled, 'warn')
  ct.ok(loggerHelpStub.notCalled, 'help')

  ct.end()
})
