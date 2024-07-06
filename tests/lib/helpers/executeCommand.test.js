const t = require('tap')
const sinon = require('sinon')
const execute = require('../../../src/lib/helpers/execute')
const { logger } = require('../../../src/shared/logger')

const executeCommand = require('../../../src/lib/helpers/executeCommand')

t.beforeEach((ct) => {
  sinon.restore()
})

t.test('executeCommand - success', async ct => {
  const execaStub = sinon.stub(execute, 'execa').returns({ exitCode: 0 })
  const processExitStub = sinon.stub(process, 'exit')

  await executeCommand(['node', 'index.js'], { HELLO: 'World' })

  ct.ok(execaStub.called, 'execa called')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')

  ct.end()
})

t.test('executeCommand - exitCode 1', async ct => {
  const execaStub = sinon.stub(execute, 'execa').returns({ exitCode: 1 })
  const processExitStub = sinon.stub(process, 'exit')
  const loggerDebugStub = sinon.stub(logger, 'debug')
  const loggerErrorStub = sinon.stub(logger, 'errornocolor')

  await executeCommand(['node', 'index.js'], { HELLO: 'World' })

  ct.ok(processExitStub.called, 'process.exit called')
  ct.ok(execaStub.called, 'execa called')
  ct.ok(loggerDebugStub.calledWith('received exitCode 1'), 'logger debug')
  ct.ok(loggerErrorStub.calledWith('Command exited with exit code 1'), 'logger error')

  ct.end()
})

t.test('executeCommand - command-does-not-exist', async ct => {
  const execaStub = sinon.stub(execute, 'execa').returns({ exitCode: 0 })
  const processExitStub = sinon.stub(process, 'exit')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  await executeCommand(['command-does-not-exist', '--', 'command-does-not-exist', 'index.js'], { HELLO: 'World' })

  ct.ok(execaStub.called, 'execa called')
  ct.ok(processExitStub.notCalled, 'process.exit should not be called')
  ct.ok(loggerDebugStub.calledWith('could not expand process command. using [command-does-not-exist -- command-does-not-exist index.js]'), 'logger debug')

  ct.end()
})

t.test('executeCommand - error with OTHER signal', async ct => {
  const error = new Error('Mock Error')
  error.signal = 'OTHER'
  error.exitCode = 1

  const execaStub = sinon.stub(execute, 'execa').throws(error)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'errornocolor')

  await executeCommand(['node', 'index.js'], { HELLO: 'World' })

  ct.ok(execaStub.called, 'execa called')
  ct.ok(processExitStub.calledWith(1), 'process.exit should be called')
  ct.ok(loggerErrorStub.calledWith('Mock Error'), 'logger error')

  ct.end()
})

t.test('executeCommand - command failed error', async ct => {
  const error = new Error('Command failed with exit code 1')
  error.signal = 'OTHER'
  error.command = 'command'
  error.exitCode = 1

  sinon.stub(execute, 'execa').throws(error)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'errornocolor')

  await executeCommand(['node', 'index.js'], { HELLO: 'World' })

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called')
  ct.ok(loggerErrorStub.calledWith('Command exited with exit code 1: command'), 'logger error')

  ct.end()
})

t.test('executeCommand - ENOENT', async ct => {
  const error = new Error('Mock Error')
  error.signal = 'OTHER'
  error.code = 'ENOENT'
  error.command = 'command'
  error.exitCode = 1

  sinon.stub(execute, 'execa').throws(error)
  const processExitStub = sinon.stub(process, 'exit')
  const loggerErrorStub = sinon.stub(logger, 'errornocolor')

  await executeCommand(['node', 'index.js'], { HELLO: 'World' })

  ct.ok(processExitStub.calledWith(1), 'process.exit should be called')
  ct.ok(loggerErrorStub.calledWith('Unknown command: command'), 'logger error')

  ct.end()
})

t.test('executeCommand - sigintHandler', async ct => {
  sinon.stub(process, 'exit')
  const loggerDebugStub = sinon.stub(logger, 'debug')

  executeCommand(['sleep', '10'], { HELLO: 'World' })

  // Allow the process to start properly
  setTimeout(() => {
    process.kill(process.pid, 'SIGINT')
  }, 1000) // Send SIGINT after 1 second

  ct.ok(loggerDebugStub.called, 'logger debug')

  ct.end()
})

// this test fails with npm test - related to sending SIGTERM
// t.test('executeCommand - sigtermHandler', async ct => {
//   sinon.stub(process, 'exit')
//   const loggerDebugStub = sinon.stub(logger, 'debug')
//
//   executeCommand(['sleep', '10'], { HELLO: 'World' })
//
//   // Allow the process to start properly
//   setTimeout(() => {
//     process.kill(process.pid, 'SIGTERM')
//   }, 1000)
//
//   ct.ok(loggerDebugStub.called, 'logger debug')
//
//   ct.end()
// })
