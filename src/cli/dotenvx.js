#!/usr/bin/env node

const updateNotifier = require('update-notifier')
const { Command } = require('commander')
const program = new Command()

const logger = require('./../shared/logger')
const helpers = require('./helpers')
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
  .option('-o, --overload', 'override existing env variables')
  .action(require('./actions/run'))

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .addHelpText('after', examples.encrypt)
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', helpers.findEnvFiles('./'))
  .action(require('./actions/encrypt'))

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

// dotenvx hub
program.addCommand(require('./commands/hub'))

program.parse(process.argv)
