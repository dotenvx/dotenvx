const t = require('tap')
const { execFileSync } = require('child_process')
const sinon = require('sinon')
const { Command } = require('commander')
const proxyquire = require('proxyquire')

const configureArmorCommand = require('../../../src/cli/commands/armor')

const armor = configureArmorCommand(new Command('armor'))
const commandsWithToken = ['up', 'down', 'push', 'pull', 'move']

t.test('armor subcommands accept explicit token option', async (ct) => {
  for (const commandName of commandsWithToken) {
    const command = armor.commands.find(command => command.name() === commandName)

    ct.ok(command, `has armor ${commandName} command`)
    ct.ok(command.options.some(option => option.long === '--token'), `armor ${commandName} declares --token`)
  }

  ct.notOk(armor.commands.find(command => command.name() === 'rotate'), 'does not have armor rotate command')
})

t.test('armor commands are native cli subcommands without rotate conflict', async (ct) => {
  const rootHelp = execFileSync(process.execPath, ['src/cli/dotenvx.js', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })
  const armorHelp = execFileSync(process.execPath, ['src/cli/dotenvx.js', 'armor', '--help'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  })

  ct.match(rootHelp, /\n\s{2}armor\s+⛨ move private keys off-device \[www\.dotenvx\.com\/armor\]/, 'root help shows curated armor line')
  ct.notMatch(rootHelp, /\n {2}armor {2,}move private keys off-device/, 'hides native armor command from root command list')

  for (const commandName of commandsWithToken) {
    ct.match(armorHelp, new RegExp(`\\n  ${commandName} \\[options\\]`), `has armor ${commandName} subcommand`)
  }

  ct.notMatch(armorHelp, /\n {2}keypair \[options\].*generate armored keypair/, 'does not register armor keypair')
  ct.notMatch(armorHelp, /\n {2}rotate \[options\].*rotate armored key/, 'does not register armor rotate')
})

t.test('armor default action shows help', async (ct) => {
  const helpStub = sinon.stub(armor, 'help')

  ct.teardown(() => {
    helpStub.restore()
  })

  await armor._actionHandler([])

  ct.equal(helpStub.callCount, 1, 'shows help')
})

t.test('armor unknown subcommands fall back to dotenvx-armor', async (ct) => {
  const executeDynamicStub = sinon.stub()
  const configureArmorCommand = proxyquire('../../../src/cli/commands/armor', {
    './../../lib/helpers/executeDynamic': executeDynamicStub
  })
  const armor = configureArmorCommand(new Command('armor'))

  await armor._actionHandler(['settings', ['--json']])

  ct.equal(executeDynamicStub.callCount, 1, 'calls dynamic fallback')
  ct.equal(executeDynamicStub.firstCall.args[0], armor, 'passes armor command for help fallback')
  ct.equal(executeDynamicStub.firstCall.args[1], 'armor', 'forwards armor command name')
  ct.same(executeDynamicStub.firstCall.args[2], ['settings', '--json'], 'forwards unknown armor args')
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
