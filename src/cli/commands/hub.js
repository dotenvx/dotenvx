const { Command } = require('commander')

const store = require('./../../shared/store')

const hub = new Command('hub')

hub
  .description('interact with dotenvx hub')

hub
  .command('login')
  .description('authenticate to dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/login'))

hub
  .command('push')
  .description('push .env.keys to dotenvx hub')
  .argument('[directory]', 'directory to push', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/push'))

hub
  .command('pull')
  .description('pull .env.keys from dotenvx hub')
  .argument('[directory]', 'directory to pull', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/pull'))

hub
  .command('open')
  .description('view repository on dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/open'))

hub
  .command('token')
  .description('print the auth token dotenvx hub is configured to use')
  .option('-h, --hostname <url>', 'set hostname', 'https://hub.dotenvx.com')
  .action(require('./../actions/hub/token'))

hub
  .command('status')
  .description('display logged in user')
  .action(require('./../actions/hub/status'))

hub
  .command('logout')
  .description('log out this machine from dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(require('./../actions/hub/logout'))

module.exports = hub
