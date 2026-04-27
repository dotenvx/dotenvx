const t = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

t.beforeEach(() => {
  sinon.restore()
})

t.test('login forwards unknown options to dotenvx-ops', (ct) => {
  const executeDynamicStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'login', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for unknown login options')
  ct.equal(executeDynamicStub.callCount, 1, 'executeDynamic is called')
  ct.equal(executeDynamicStub.firstCall.args[1], 'ops', 'dynamic command targets ops')
  ct.same(executeDynamicStub.firstCall.args[2], ['ops', 'login', '--hostname', 'api.example.com'], 'unknown options are forwarded')

  process.argv = originalArgv
  ct.end()
})

t.test('armor forwards subcommands to dotenvx-ops armor', (ct) => {
  const executeDynamicStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'armor', 'up', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for armor alias')
  ct.equal(executeDynamicStub.callCount, 1, 'executeDynamic is called')
  ct.equal(executeDynamicStub.firstCall.args[1], 'ops', 'dynamic command targets ops')
  ct.same(executeDynamicStub.firstCall.args[2], ['ops', 'armor', 'up', '--hostname', 'api.example.com'], 'subcommands are forwarded to ops armor')

  process.argv = originalArgv
  ct.end()
})
