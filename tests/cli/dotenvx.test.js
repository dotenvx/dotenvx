const t = require('tap')
const fs = require('fs')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire').noCallThru()

t.beforeEach(() => {
  sinon.restore()
})

t.test('login and logout remain hidden from default command list', ct => {
  const src = fs.readFileSync(path.join(__dirname, '../../src/cli/dotenvx.js'), 'utf8')

  ct.match(src, /program\.command\('login', \{ hidden: true \}\)/)
  ct.match(src, /program\.addHelpText\('after', '\s{2}login\s+log in to move keys off-device, share with your team, and audit access'\)/)
  ct.match(src, /program\.command\('logout', \{ hidden: true \}\)/)
  ct.match(src, /\.description\('log out of connected security features'\)/)
  ct.match(src, /program\.addHelpText\('after', '\s{2}logout\s+log out of connected security features'\)/)
  ct.end()
})

t.test('login resolves through native action', (ct) => {
  const executeDynamicStub = sinon.stub()
  const loginStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'login', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './actions/login': loginStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for unknown login options')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(loginStub.callCount, 1, 'login action is called')
  ct.equal(loginStub.firstCall.thisValue.opts().hostname, 'api.example.com', 'hostname option is parsed')

  process.argv = originalArgv
  ct.end()
})

t.test('logout resolves through native action', (ct) => {
  const executeDynamicStub = sinon.stub()
  const logoutStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'logout', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './actions/logout': logoutStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for unknown logout options')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(logoutStub.callCount, 1, 'logout action is called')
  ct.equal(logoutStub.firstCall.thisValue.opts().hostname, 'api.example.com', 'hostname option is parsed')

  process.argv = originalArgv
  ct.end()
})

t.test('armor resolves through native command', (ct) => {
  const { Command } = require('commander')
  const armorCommand = new Command('armor')
  const executeDynamicStub = sinon.stub()
  const upStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  armorCommand
    .command('up')
    .allowUnknownOption()
    .option('--hostname <hostname>', 'set hostname')
    .action(function (...args) {
      return upStub.apply(this, args)
    })

  process.argv = ['node', 'dotenvx', 'armor', 'up', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './commands/armor': armorCommand,
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for native armor command')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(upStub.callCount, 1, 'armor up action is called')
  ct.equal(upStub.firstCall.thisValue.opts().hostname, 'api.example.com', 'hostname option is parsed')

  process.argv = originalArgv
  ct.end()
})
