const commandAction = require('../commandAction')
function configureSettingsCommand (settings) {
  settings
    .description('settings')
    .action(function () {
      this.help()
    })

  settings
    .command('username')
    .description('print your username')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/username')).apply(this, args)
    })

  settings
    .command('token')
    .description('print your access token (--unmask)')
    .option('--unmask', 'unmask access token')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/token')).apply(this, args)
    })

  settings
    .command('device')
    .description('print your device pubkey (--unmask)')
    .option('--unmask', 'unmask device pubkey')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/device')).apply(this, args)
    })

  settings
    .command('hostname')
    .description('print hostname')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/hostname')).apply(this, args)
    })

  settings
    .command('path')
    .description('print path to settings file')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/path')).apply(this, args)
    })

  settings
    .command('on')
    .description('turn armor on')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/on')).apply(this, args)
    })

  settings
    .command('off')
    .description('turn armor off')
    .action(function (...args) {
      return commandAction(require('./../actions/settings/off')).apply(this, args)
    })

  return settings
}

module.exports = configureSettingsCommand
