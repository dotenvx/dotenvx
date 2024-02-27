#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const { Command } = require('commander')
const program = new Command()

const logger = require('./../shared/logger')
const examples = require('./examples')
const packageJson = require('./../shared/packageJson')

// once a day check for any updates
const notifier = updateNotifier({ pkg: packageJson })
if (notifier.update) {
  logger.warn(`Update available ${notifier.update.current} → ${notifier.update.latest} [see changelog](dotenvx.com/changelog)`)
}

// global log levels
program
  .option('-l, --log-level <level>', 'set log level', 'info')
  .option('-q, --quiet', 'sets log level to error')
  .option('-v, --verbose', 'sets log level to verbose')
  .option('-d, --debug', 'sets log level to debug')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = thisCommand.opts()

    if (options.logLevel) {
      logger.level = options.logLevel
      logger.debug(`setting log level to ${options.logLevel}`)
    }

    // --quiet overides --log-level. only errors will be shown
    if (options.quiet) {
      logger.level = 'error'
    }

    // --verbose overrides --quiet
    if (options.verbose) {
      logger.level = 'verbose'
    }

    // --debug overrides --verbose
    if (options.debug) {
      logger.level = 'debug'
    }
  })

// cli
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

// dotenvx run -- node index.js
program.command('run')
  .description('inject env at runtime [dotenvx run -- yourcommand]')
  .addHelpText('after', examples.run)
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .option('-fv, --env-vault-file <path>', 'path to your .env.vault file', '.env.vault')
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")')
  .option('-o, --overload', 'override existing env variables')
  .action(require('./actions/run'))

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .addHelpText('after', examples.encrypt)
  .argument('[directory]', 'directory to encrypt', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(require('./actions/encrypt'))

// dotenvx decrypt
program.command('decrypt')
  .description('decrypt .env.vault to .env*')
  .action(require('./actions/decrypt'))

// dotenvx gitignore
program.command('gitignore')
  .description('append to .gitignore file (and if existing, .dockerignore, .npmignore, and .vercelignore)')
  .addHelpText('after', examples.gitignore)
  .action(require('./actions/gitignore'))

// dotenvx precommit
program.command('precommit')
  .description('prevent committing .env files to code')
  .addHelpText('after', examples.precommit)
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(require('./actions/precommit'))

// dotenvx prebuild
program.command('prebuild')
  .description('prevent including .env files in docker builds')
  .addHelpText('after', examples.prebuild)
  .action(require('./actions/prebuild'))

// dotenvx genexample
program.command('genexample')
  .description('generate .env.example')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(require('./actions/genexample'))

// dotenvx scan
program.command('scan')
  .description('scan for leaked secrets')
  .action(require('./actions/scan'))

// dotenvx ls
program.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(require('./actions/ls'))

// dotenvx get
program.command('get')
  .description('Return environment variable(s)')
  .argument('[key]', 'environment variable name')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .option('-o, --overload', 'override existing env variables')
  .option('-a, --all', 'include all machine envs as well')
  .option('-pp, --pretty-print', 'pretty print output')
  .action(require('./actions/get'))

// dotenvx hub
program.addCommand(require('./commands/hub'))

program.parse(process.argv)
