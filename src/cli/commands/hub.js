const { Command } = require('commander')

const store = require('./../../shared/store')
const { logger } = require('./../../shared/logger')

const hub = new Command('hub')

hub
  .description('DEPRECATED: to be replaced by [dotenvx pro]')

const loginAction = require('./../actions/ext/hub/login')
hub
  .command('login')
  .description('DEPRECATED: moved to [dotenvx ext hub login]')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub login] moved to [dotenvx ext hub login]')

    loginAction.apply(this, args)
  })

const pushAction = require('./../actions/ext/hub/push')
hub
  .command('push')
  .description('DEPRECATED: moved to [dotenvx ext hub push]')
  .argument('[directory]', 'directory to push', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub push] moved to [dotenvx ext hub push]')

    pushAction.apply(this, args)
  })

const pullAction = require('./../actions/ext/hub/pull')
hub
  .command('pull')
  .description('DEPRECATED: moved to [dotenvx ext hub pull]')
  .argument('[directory]', 'directory to pull', '.')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub pull] moved to [dotenvx ext hub pull]')

    pullAction.apply(this, args)
  })

const openAction = require('./../actions/ext/hub/open')
hub
  .command('open')
  .description('DEPRECATED: moved to [dotenvx ext hub open]')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub open] moved to [dotenvx ext hub open]')

    openAction.apply(this, args)
  })

const tokenAction = require('./../actions/ext/hub/token')
hub
  .command('token')
  .description('DEPRECATED: moved to [dotenvx ext hub token]')
  .option('-h, --hostname <url>', 'set hostname', 'https://hub.dotenvx.com')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub token] moved to [dotenvx ext hub token]')

    tokenAction.apply(this, args)
  })

const statusAction = require('./../actions/ext/hub/status')
hub
  .command('status')
  .description('DEPRECATED: moved to [dotenvx ext hub status]')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub status] moved to [dotenvx ext hub status]')

    statusAction.apply(this, args)
  })

const logoutAction = require('./../actions/ext/hub/logout')
hub
  .command('logout')
  .description('DEPRECATED: moved to [dotenvx ext hub logout]')
  .option('-h, --hostname <url>', 'set hostname', store.getHostname())
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx hub logout] moved to [dotenvx ext hub logout]')

    logoutAction.apply(this, args)
  })

module.exports = hub
