const { Command } = require('commander')

const examples = require('./../examples')
const { logger } = require('./../../shared/logger')

const vault = new Command('vault')

vault
  .description('DEPRECATED: moved to [dotenvx ext vault]')

// dotenvx vault migrate
const migrateAction = require('./../actions/ext/vault/migrate')
vault.command('migrate')
  .description('DEPRECATED: moved to [dotenvx ext vault migrate]')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx vault migrate] moved to [dotenvx ext vault migrate]')

    migrateAction.apply(this, args)
  })

// dotenvx vault encrypt
const encryptAction = require('./../actions/ext/vault/encrypt')
vault.command('encrypt')
  .description('DEPRECATED: moved to [dotenvx ext vault encrypt]')
  .addHelpText('after', examples.vaultEncrypt)
  .argument('[directory]', 'directory to encrypt', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx vault encrypt] moved to [dotenvx ext vault encrypt]')

    encryptAction.apply(this, args)
  })

// dotenvx vault decrypt
const decryptAction = require('./../actions/ext/vault/decrypt')
vault.command('decrypt')
  .description('DEPRECATED: moved to [dotenvx ext vault decrypt]')
  .argument('[directory]', 'directory to decrypt', '.')
  .option('-e, --environment <environments...>', 'environment(s) to decrypt')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx vault decrypt] moved to [dotenvx ext vault decrypt]')

    decryptAction.apply(this, args)
  })

// dotenvx vault status
const statusAction = require('./../actions/ext/vault/status')
vault.command('status')
  .description('DEPRECATED: moved to [dotenvx ext vault status]')
  .argument('[directory]', 'directory to check status against', '.')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx vault status] moved to [dotenvx ext vault status]')

    statusAction.apply(this, args)
  })

module.exports = vault
