const { Command } = require('commander')

const store = require('./../../shared/store')
const { logger } = require('./../../shared/logger')

const ext = new Command('ext')

ext
  .description('extended dotenvx functionality')

// dotenvx ls
ext.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(require('./../actions/ext/ls'))

module.exports = ext
