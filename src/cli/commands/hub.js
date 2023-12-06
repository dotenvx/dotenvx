const { Command } = require('commander')

const hub = new Command('hub')

hub
  .description('Interact with the hub')

hub
  .command('login')
  .description('authenticate to dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', 'https://hub.dotenvx.com')
  .action(require('./../actions/hub/login'))

module.exports = hub
