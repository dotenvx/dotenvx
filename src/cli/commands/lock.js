const commandAction = require('../commandAction')
function configureLockCommand (lock) {
  lock.hook('preAction', async () => {
    const Session = require('./../../db/session')
    const sesh = new Session()
    await sesh.notifyUpdate()
  })

  lock
    .description('lock private keys with a local passphrase')
    .action(function () {
      this.help()
    })

  lock
    .command('up')
    .description('lock key in .env.keys')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('-fk, --env-keys-file <path>', 'path to your .env.keys file', '.env.keys')
    .action(function (...args) {
      return commandAction(require('./../actions/lock/up')).apply(this, args)
    })

  lock
    .command('down')
    .description('unlock key in .env.keys')
    .option('-f, --env-file <path>', 'path to your env file')
    .option('-fk, --env-keys-file <path>', 'path to your .env.keys file', '.env.keys')
    .action(function (...args) {
      return commandAction(require('./../actions/lock/down')).apply(this, args)
    })

  return lock
}

module.exports = configureLockCommand
