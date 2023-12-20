#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const { Command } = require('commander')
const program = new Command()

const logger = require('./../shared/logger')
const helpers = require('./helpers')
const examples = require('./examples')
const { AppendToIgnores } = require('./ignores')
const packageJson = require('./../shared/packageJson')

// once a day check for any updates
updateNotifier({ pkg: packageJson }).notify()

// global log levels
program
  .option('-l, --log-level <level>', 'set log level', 'info')
  .option('-q, --quiet', 'sets log level to error')
  .option('-v, --verbose', 'sets log level to verbose')
  .option('-d, --debug', 'sets log level to debug')
  .hook('preAction', (thisCommand, actionCommand) => {
    new AppendToIgnores().run()

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
  .description('inject env at runtime [dotenvx run -- your-command-here]')
  .addHelpText('after', examples.run)
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .option('-o, --overload', 'override existing env variables')
  .action(require('./actions/run'))

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .addHelpText('after', examples.encrypt)
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', helpers.findEnvFiles('./'))
  .action(require('./actions/encrypt'))

// dotenvx hub
program.addCommand(require('./commands/hub'))

program.parse(process.argv)
