const { Command } = require('commander')

const hub = new Command('hub')

hub
  .description('Interact with the hub')

hub
  .command('login')
  .description('login to hub')
  .action(require('./../actions/hub/login'))

module.exports = hub
