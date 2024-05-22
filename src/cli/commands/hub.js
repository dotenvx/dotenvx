const { Command } = require('commander')

const store = require('./../../shared/store')
const { logger } = require('./../../shared/logger')

const hub = new Command('hub')

hub
  .description('DEPRECATED: interact with dotenvx hub')

const loginAction = require('./../actions/hub/login')
hub
  .command('login')
  .description('authenticate to dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub login] will be removed in 1.0.0 release soon')

    loginAction.apply(this, args)
  })

const pushAction = require('./../actions/hub/push')
hub
  .command('push')
  .description('push .env.keys to dotenvx hub')
  .argument('[directory]', 'directory to push', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub push] will be removed in 1.0.0 release soon')

    pushAction.apply(this, args)
  })

const pullAction = require('./../actions/hub/pull')
hub
  .command('pull')
  .description('pull .env.keys from dotenvx hub')
  .argument('[directory]', 'directory to pull', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub pull] will be removed in 1.0.0 release soon')

    pullAction.apply(this, args)
  })

const openAction = require('./../actions/hub/open')
hub
  .command('open')
  .description('view repository on dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub open] will be removed in 1.0.0 release soon')

    openAction.apply(this, args)
  })

const tokenAction = require('./../actions/hub/token')
hub
  .command('token')
  .description('print the auth token dotenvx hub is configured to use')
  .option('-h, --hostname <url>', 'set hostname', 'https://hub.dotenvx.com')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub token] will be removed in 1.0.0 release soon')

    tokenAction.apply(this, args)
  })

const statusAction = require('./../actions/hub/status')
hub
  .command('status')
  .description('display logged in user')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub status] will be removed in 1.0.0 release soon')

    statusAction.apply(this, args)
  })

const logoutAction = require('./../actions/hub/logout')
hub
  .command('logout')
  .description('log out this machine from dotenvx hub')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub logout] will be removed in 1.0.0 release soon')

    logoutAction.apply(this, args)
  })

module.exports = hub
