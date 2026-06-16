const executeDynamic = require('./../../lib/helpers/executeDynamic')
const Session = require('./../../db/session')

function configureArmorCommand (armor) {
  armor
    .description('move private keys off-device')
    .allowUnknownOption()
    .argument('[command]', 'dotenvx-armor command')
    .argument('[args...]', 'dotenvx-armor command arguments')
    .action(async function (command, args) {
      if (command) {
        return executeDynamic(armor, 'armor', [command, ...(args || [])])
      }

      const sesh = new Session()
      await sesh.notifyUpdate()
      this.help()
    })

  // dotenvx armor up
  const upAction = require('./../actions/armor/up')
  armor
    .command('up')
    .description('armor key')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to armor private key for')
    .action(upAction)

  // dotenvx armor down
  const downAction = require('./../actions/armor/down')
  armor
    .command('down')
    .description('dearmor key')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to dearmor private key from')
    .action(downAction)

  // dotenvx armor push
  const pushAction = require('./../actions/armor/push')
  armor
    .command('push')
    .description('push armored key (from .env.keys)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to push armored private key for')
    .action(pushAction)

  // dotenvx armor pull
  const pullAction = require('./../actions/armor/pull')
  armor
    .command('pull')
    .description('pull armored key (into .env.keys)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .option('--team <team>', 'team to pull armored private key from')
    .action(pullAction)

  // dotenvx armor move
  const moveAction = require('./../actions/armor/move')
  armor
    .command('move')
    .description('move armored key (to other team)')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('--token <token>', 'set token')
    .action(moveAction)

  return armor
}

module.exports = configureArmorCommand
