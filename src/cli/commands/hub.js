const { Command } = require('commander')

const store = require('./../../shared/store')

const hub = new Command('hub')

hub
  .description('Interact with the hub')

hub
  .command('login')
  .description('authenticate to dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/login'))

hub
  .command('token')
  .description('print the auth token dotenvx hub is configured to use')
  .option('-h, --hostname <url>', 'set hostname', 'https://hub.dotenvx.com')
  .action(require('./../actions/hub/token'))

module.exports = hub
