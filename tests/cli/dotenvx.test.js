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
  ct.match(src, /program\.command\('logout', \{ hidden: true \}\)/)
  ct.match(src, /\.description\('log out of connected security features'\)/)
  ct.match(src, /program\.command\('armor', \{ hidden: true \}\)/)
  ct.notMatch(src, /program\.addCommand\(require\('\.\/commands\/armor'\), \{ hidden: true \}\)/)

  const help = childProcess.execFileSync(process.execPath, [path.join(__dirname, '../../src/cli/dotenvx.js'), '--help'], { encoding: 'utf8' })
  const professionalSecurity = help.slice(help.indexOf('Professional Security:'))
  ct.notMatch(professionalSecurity, /\n\s+login\s+/, 'root help does not advertise login')
  ct.notMatch(professionalSecurity, /\n\s+logout\s+/, 'root help does not advertise logout')
  ct.match(professionalSecurity, /\n\s+armor\s+⛨ move private keys into Dotenvx Armor/, 'root help advertises armor')
  ct.match(professionalSecurity, /\n\s+curl\s+⛨ call authenticated api Dotenvx Armor/, 'root help advertises curl')
  ct.end()
})

t.test('default help lists direct utility commands with ls first after keypair', ct => {
  const help = childProcess.execFileSync(process.execPath, [path.join(__dirname, '../../src/cli/dotenvx.js'), '--help'], { encoding: 'utf8' })
  const commands = help.slice(help.indexOf('Commands:'), help.indexOf('Professional Security:'))

  ct.match(commands, /gitignore\s+append to \.gitignore/)
  ct.match(commands, /validate\s+validate \.env file\(s\) against \.env\.example/)
  ct.match(commands, /genexample \[directory\]\s+generate \.env\.example/)
  ct.match(commands, /prebuild \[directory\]\s+prevent including \.env files/)
  ct.match(commands, /precommit \[directory\]\s+prevent committing \.env files/)
  ct.match(commands, /update\s+update dotenvx/)
  ct.match(commands, /ls \[directory\]\s+print all \.env files/)
  ct.notMatch(commands, /scan\s+scan for leaked secrets/)
  ct.notMatch(commands, /ext\s+.*extensions/)
  ct.ok(commands.indexOf('keypair [KEY]') < commands.indexOf('ls [directory]'), 'ls is listed after keypair')
  ct.ok(commands.indexOf('ls [directory]') < commands.indexOf('validate'), 'validate is listed after ls')
  ct.ok(commands.indexOf('validate') < commands.indexOf('gitignore'), 'validate is listed before gitignore')
  ct.ok(commands.indexOf('gitignore') < commands.indexOf('genexample [directory]'), 'gitignore is listed before genexample')
  ct.ok(commands.indexOf('validate') < commands.indexOf('precommit [directory]'), 'validate is listed before precommit')
  ct.ok(commands.indexOf('precommit [directory]') < commands.indexOf('prebuild [directory]'), 'precommit is listed before prebuild')

  ct.end()
})

t.test('enc is a hidden shorthand for encrypt', (ct) => {
  const src = fs.readFileSync(path.join(__dirname, '../../src/cli/dotenvx.js'), 'utf8')
  ct.match(src, /program\.command\('enc', \{ hidden: true \}\)/)

  const help = childProcess.execFileSync(process.execPath, [path.join(__dirname, '../../src/cli/dotenvx.js'), '--help'], { encoding: 'utf8' })
  ct.match(help, /\n\s+encrypt\s+encrypt \.env file\(s\)/)
  ct.notMatch(help, /encrypt\|enc/)
  ct.notMatch(help, /\n\s+enc\s+/, 'root help does not advertise enc')

  const executeDynamicStub = sinon.stub()
  const encryptStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'enc', '--env-file', '.env.production']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './actions/encrypt': encryptStub
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(encryptStub.callCount, 1, 'encrypt action is called via enc shorthand')

  process.argv = originalArgv
  ct.end()
})

t.test('dec is a hidden shorthand for decrypt', (ct) => {
  const src = fs.readFileSync(path.join(__dirname, '../../src/cli/dotenvx.js'), 'utf8')
  ct.match(src, /program\.command\('dec', \{ hidden: true \}\)/)

  const help = childProcess.execFileSync(process.execPath, [path.join(__dirname, '../../src/cli/dotenvx.js'), '--help'], { encoding: 'utf8' })
  ct.match(help, /\n\s+decrypt\s+decrypt \.env file\(s\)/)
  ct.notMatch(help, /decrypt\|dec/)
  ct.notMatch(help, /\n\s+dec\s+/, 'root help does not advertise dec')

  const executeDynamicStub = sinon.stub()
  const decryptStub = sinon.stub()
  const processExitStub = sinon.stub(process, 'exit')
  const originalArgv = process.argv

  process.argv = ['node', 'dotenvx', 'dec', '--env-file', '.env.production']

  proxyquire('../../src/cli/dotenvx', {
    './../lib/helpers/executeDynamic': executeDynamicStub,
    './actions/decrypt': decryptStub
  })

  ct.equal(processExitStub.callCount, 0, 'process.exit is not called')
  ct.equal(executeDynamicStub.callCount, 0, 'executeDynamic is not called')
  ct.equal(decryptStub.callCount, 1, 'decrypt action is called via dec shorthand')

  process.argv = originalArgv
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
    './actions/login': loginStub
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
    './actions/logout': logoutStub
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
    './../lib/helpers/executeDynamic': executeDynamicStub
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
