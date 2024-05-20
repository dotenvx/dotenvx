const { Command } = require('commander')

const examples = require('./../examples')

const vault = new Command('vault')

vault
  .description('manage .env.vault files')

// dotenvx vault convert
vault.command('convert')
  .description('instructions for converting .env.vault to encrypted env file(s)')
  .action(require('./../actions/vault/convert'))

// dotenvx vault encrypt
vault.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .addHelpText('after', examples.encrypt)
  .argument('[directory]', 'directory to encrypt', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(require('./../actions/vault/encrypt'))

// dotenvx vault decrypt
vault.command('decrypt')
  .description('decrypt .env.vault to .env*')
  .argument('[directory]', 'directory to decrypt', '.')
  .option('-e, --environment <environments...>', 'environment(s) to decrypt')
  .action(require('./../actions/vault/decrypt'))

// dotenvx vault status
vault.command('status')
  .description('compare your .env* content(s) to your .env.vault decrypted content(s)')
  .argument('[directory]', 'directory to check status against', '.')
  .action(require('./../actions/vault/status'))

module.exports = vault
