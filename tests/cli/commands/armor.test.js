const t = require('tap')
const { execFileSync } = require('child_process')
const sinon = require('sinon')
const { Command } = require('@dotenvx/tooling')
const proxyquire = require('proxyquire')

const configureArmorCommand = require('../../../src/cli/commands/armor')
const Session = require('../../../src/db/session')

const armor = configureArmorCommand(new Command('armor'))
const commandsWithToken = ['up', 'down', 'push', 'pull', 'move']
const nativeCommands = ['up', 'down', 'push', 'pull', 'open', 'move', 'login', 'logout', 'status', 'settings']

t.test('armor subcommands accept explicit token option', async (ct) => {
  for (const commandName of commandsWithToken) {
    const command = armor.commands.find(command => command.name() === commandName)

    ct.ok(command, `has armor ${commandName} command`)
    ct.ok(command.options.some(option => option.long === '--token'), `armor ${commandName} declares --token`)
  }
})

t.test('armor commands are native cli subcommands', async (ct) => {
  const rootHelp = execFileSync(process.execPath, ['src/cli/dotenvx.js', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  const armorHelp = execFileSync(process.execPath, ['src/cli/dotenvx.js', 'armor', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })

  ct.match(rootHelp, /\n\s{2}armor\s+⛨ move private keys into Dotenvx Armor \[www\.dotenvx\.com\/armor\]/, 'root help shows curated armor line')
  ct.match(rootHelp, /\n\s{2}curl\s+⛨ call authenticated api Dotenvx Armor \[www\.dotenvx\.com\/armor\]/, 'root help shows curated curl line')
  ct.notMatch(rootHelp, /\n {2}armor {2,}move private keys off-device/, 'hides native armor command from root command list')

  for (const commandName of nativeCommands) {
    const options = ['status', 'settings'].includes(commandName) ? '' : ' \\[options\\]'
    ct.match(armorHelp, new RegExp(`\\n  ${commandName}${options}`), `has armor ${commandName} subcommand`)
  }
  ct.same(armor.commands.map(command => command.name()), nativeCommands, 'orders open before move, then login, logout, status, and settings')

  ct.notMatch(armorHelp, /\n {2}keypair \[options\].*generate armored keypair/, 'does not register armor keypair')
})

t.test('armor login and logout resolve through native actions', async (ct) => {
  const loginStub = sinon.stub()
  const logoutStub = sinon.stub()
  const configureArmorCommand = proxyquire('../../../src/cli/commands/armor', {
    './../actions/login': loginStub,
    './../actions/logout': logoutStub
  })
  const armor = configureArmorCommand(new Command('armor'))
  const login = armor.commands.find(command => command.name() === 'login')
  const logout = armor.commands.find(command => command.name() === 'logout')

  ct.ok(login.options.some(option => option.long === '--hostname'), 'armor login declares --hostname')
  ct.ok(logout.options.some(option => option.long === '--hostname'), 'armor logout declares --hostname')

  await login._actionHandler([])
  await logout._actionHandler([])

  ct.equal(loginStub.callCount, 1, 'login action is called')
  ct.equal(logoutStub.callCount, 1, 'logout action is called')
})

t.test('armor status resolves through native action', async (ct) => {
  const statusStub = sinon.stub()
  const executeDynamicStub = sinon.stub()
  const configureArmorCommand = proxyquire('../../../src/cli/commands/armor', {
    './../actions/armor/status': statusStub,
    './../../lib/helpers/executeDynamic': executeDynamicStub
  })
  const armor = configureArmorCommand(new Command('armor'))
  const status = armor.commands.find(command => command.name() === 'status')

  await status._actionHandler([])

  ct.equal(statusStub.callCount, 1, 'status action is called')
  ct.equal(executeDynamicStub.callCount, 0, 'does not call dotenvx-armor')
})

t.test('armor settings is an embedded native command', async (ct) => {
  const settings = armor.commands.find(command => command.name() === 'settings')

  ct.ok(settings, 'has armor settings command')
  ct.same(settings.commands.map(command => command.name()), [
    'username',
    'token',
    'device',
    'hostname',
    'path',
    'on',
    'off'
  ], 'has all settings commands')

  for (const commandName of ['token', 'device']) {
    const command = settings.commands.find(command => command.name() === commandName)
    ct.ok(command.options.some(option => option.long === '--unmask'), `settings ${commandName} declares --unmask`)
  }
})

t.test('armor default action shows help', async (ct) => {
  const helpStub = sinon.stub(armor, 'help')
  const notifyUpdateStub = sinon.stub(Session.prototype, 'notifyUpdate').resolves()

  ct.teardown(() => {
    notifyUpdateStub.restore()
    helpStub.restore()
  })

  await armor._actionHandler([])

  ct.equal(notifyUpdateStub.callCount, 1, 'checks for dotenvx update')
  ct.equal(helpStub.callCount, 1, 'shows help')
})

t.test('armor unknown subcommands fall back to dotenvx-armor', async (ct) => {
  const executeDynamicStub = sinon.stub()
  const configureArmorCommand = proxyquire('../../../src/cli/commands/armor', {
    './../../lib/helpers/executeDynamic': executeDynamicStub
  })
  const armor = configureArmorCommand(new Command('armor'))

  await armor._actionHandler(['rotate', ['--json']])

  ct.equal(executeDynamicStub.callCount, 1, 'calls dynamic fallback')
  ct.equal(executeDynamicStub.firstCall.args[0], armor, 'passes armor command for help fallback')
  ct.equal(executeDynamicStub.firstCall.args[1], 'armor', 'forwards armor command name')
  ct.same(executeDynamicStub.firstCall.args[2], ['rotate', '--json'], 'forwards unknown armor args')
})

t.test('armor keypair is treated as an unknown armor command', async (ct) => {
  const executeDynamicStub = sinon.stub()
  const configureArmorCommand = proxyquire('../../../src/cli/commands/armor', {
    './../../lib/helpers/executeDynamic': executeDynamicStub
  })
  const armor = configureArmorCommand(new Command('armor'))

  await armor._actionHandler(['keypair', ['--token', 'token-123', '--team', 'acme', '-f', '.env.production']])

  ct.equal(executeDynamicStub.callCount, 1, 'calls dynamic fallback')
  ct.equal(executeDynamicStub.firstCall.args[0], armor, 'passes armor command for help fallback')
  ct.equal(executeDynamicStub.firstCall.args[1], 'armor', 'forwards armor command name')
  ct.same(executeDynamicStub.firstCall.args[2], [
    'keypair',
    '--token',
    'token-123',
    '--team',
    'acme',
    '-f',
    '.env.production'
  ], 'forwards keypair as an unknown armor command')
})
