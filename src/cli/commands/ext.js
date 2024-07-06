const { Command } = require('commander')

const examples = require('./../examples')
const executeExtension = require('../../lib/helpers/executeExtension')

const ext = new Command('ext')

ext
  .description('🔌 extensions')
  .allowUnknownOption()

ext.addHelpText('after', '  hub                               🚫 DEPRECATED: to be replaced by [dotenvx pro]')

ext
  .argument('[command]', 'dynamic ext command')
  .argument('[args...]', 'dynamic ext command arguments')
  .action((command, args, cmdObj) => {
    const rawArgs = process.argv.slice(3) // adjust the index based on where actual args start
    executeExtension(ext, command, rawArgs)
  })

// dotenvx ext ls
ext.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(require('./../actions/ext/ls'))

// dotenvx ext genexample
ext.command('genexample')
  .description('generate .env.example')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(require('./../actions/ext/genexample'))

// dotenvx ext gitignore
ext.command('gitignore')
  .description('append to .gitignore file (and if existing, .dockerignore, .npmignore, and .vercelignore)')
  .addHelpText('after', examples.gitignore)
  .action(require('./../actions/ext/gitignore'))

// dotenvx ext prebuild
ext.command('prebuild')
  .description('prevent including .env files in docker builds')
  .addHelpText('after', examples.prebuild)
  .action(require('./../actions/ext/prebuild'))

// dotenvx ext precommit
ext.command('precommit')
  .description('prevent committing .env files to code')
  .addHelpText('after', examples.precommit)
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(require('./../actions/ext/precommit'))

// dotenvx scan
ext.command('scan')
  .description('scan for leaked secrets')
  .action(require('./../actions/ext/scan'))

// dotenvx settings
ext.command('settings')
  .description('print current dotenvx settings')
  .argument('[key]', 'settings name')
  .option('-pp, --pretty-print', 'pretty print output')
  .action(require('./../actions/ext/settings'))

ext.addCommand(require('./../commands/ext/vault'))

module.exports = ext
