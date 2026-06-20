const t = require('tap')
const childProcess = require('child_process')
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
  ct.match(src, /program\.command\('armor', \{ hidden: true \}\)/)
  ct.notMatch(src, /program\.addCommand\(require\('\.\/commands\/armor'\), \{ hidden: true \}\)/)
  ct.end()
})

t.test('default help lists direct utility commands with ls first after keypair', ct => {
  const help = childProcess.execFileSync(process.execPath, [path.join(__dirname, '../../src/cli/dotenvx.js'), '--help'], { encoding: 'utf8' })
  const commands = help.slice(help.indexOf('Commands:'), help.indexOf('Professional Security:'))

  ct.match(commands, /gitignore\s+append to \.gitignore/)
  ct.match(commands, /prebuild \[directory\]\s+prevent including \.env files/)
  ct.match(commands, /precommit \[directory\]\s+prevent committing \.env files/)
  ct.match(commands, /ls \[directory\]\s+print all \.env files/)
  ct.notMatch(commands, /genexample \[directory\]/)
  ct.notMatch(commands, /scan\s+scan for leaked secrets/)
  ct.notMatch(commands, /ext\s+.*extensions/)
  ct.ok(commands.indexOf('keypair [KEY]') < commands.indexOf('ls [directory]'), 'ls is listed after keypair')
  ct.ok(commands.indexOf('ls [directory]') < commands.indexOf('gitignore'), 'ls is listed before other utility commands')
  ct.ok(commands.indexOf('precommit [directory]') < commands.indexOf('prebuild [directory]'), 'precommit is listed before prebuild')

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
  const executeDynamicStub = sinon.stub()
  const configureArmorCommandStub = sinon.stub().callsFake((armorCommand) => {
    armorCommand
      .command('up')
      .allowUnknownOption()
      .option('--hostname <hostname>', 'set hostname')
      .action(function (...args) {
        return upStub.apply(this, args)
      })

    return armorCommand
  })
  const upStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'armor', 'up', '--hostname', 'api.example.com']

  proxyquire('../../src/cli/dotenvx', {
    './commands/armor': configureArmorCommandStub,
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './../lib/helpers/getCommanderVersion': () => '11.1.0'
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called for native armor command')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(configureArmorCommandStub.callCount, 1, 'armor command is configured')
  ct.equal(configureArmorCommandStub.firstCall.args[0].name(), 'armor', 'configures native armor command')
  ct.equal(upStub.callCount, 1, 'armor up action is called')
  ct.equal(upStub.firstCall.thisValue.opts().hostname, 'api.example.com', 'hostname option is parsed')

  process.argv = originalArgv
  ct.end()
})
