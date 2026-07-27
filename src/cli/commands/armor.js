const executeDynamic = require('./../../lib/helpers/executeDynamic')

function configureArmorCommand (armor) {
  armor
    .description('move private keys into Dotenvx Armor [www.dotenvx.com/armor]')
    .allowUnknownOption()
    .argument('[command]', 'dotenvx-armor command')
    .argument('[args...]', 'dotenvx-armor command arguments')
    .action(async function (command, args) {
      if (command) {
        return executeDynamic(armor, 'armor', [command, ...(args || [])])
      }

      const Session = require('./../../db/session')
      const sesh = new Session()
      await sesh.notifyUpdate()
      this.help()
    })

  // dotenvx armor up
  armor
    .command('up')
    .description('armor key')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to armor private key for')
    .action(function (...args) {
      return require('./../actions/armor/up').apply(this, args)
    })

  // dotenvx armor down
  armor
    .command('down')
    .description('dearmor key')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to dearmor private key from')
    .action(function (...args) {
      return require('./../actions/armor/down').apply(this, args)
    })

  // dotenvx armor push
  armor
    .command('push')
    .description('push armored key (from .env.keys)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to push armored private key for')
    .action(function (...args) {
      return require('./../actions/armor/push').apply(this, args)
    })

  // dotenvx armor pull
  armor
    .command('pull')
    .description('pull armored key (into .env.keys)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to pull armored private key from')
    .action(function (...args) {
      return require('./../actions/armor/pull').apply(this, args)
    })

  // dotenvx armor open
  armor
    .command('open')
    .description('open armored key (in browser)')
    .option('-f, --env-file <path>', 'path to your env file')
    .action(function (...args) {
      return require('./../actions/armor/open').apply(this, args)
    })

  // dotenvx armor move
  armor
    .command('move')
    .description('move armored key (to other team)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .action(function (...args) {
      return require('./../actions/armor/move').apply(this, args)
    })

  // dotenvx armor login
  armor
    .command('login')
    .description('log in to Dotenvx Armor')
    .allowUnknownOption()
    .option('--hostname <hostname>', 'set Armor ⛨ hostname')
    .action(function (...args) {
      return require('./../actions/login').apply(this, args)
    })

  // dotenvx armor logout
  armor
    .command('logout')
    .description('log out of Dotenvx Armor')
    .allowUnknownOption()
    .option('--hostname <hostname>', 'set Armor ⛨ hostname')
    .action(function (...args) {
      return require('./../actions/logout').apply(this, args)
    })

  // dotenvx armor status
  armor
    .command('status')
    .description('print armor status')
    .action(function (...args) {
      return require('./../actions/armor/status').apply(this, args)
    })

  // dotenvx armor settings
  require('./settings')(armor.command('settings'))

  return armor
}

module.exports = configureArmorCommand
