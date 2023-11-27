#!/usr/bin/env node

const fs = require('fs')
const { Command } = require('commander')
const program = new Command()

// constants
const ENCODING = 'utf8'

const logger = require('./../shared/logger')
const helpers = require('./helpers')
const keys = require('./keys')
const packageJson = require('./../shared/packageJson')
const main = require('./../lib/main')

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
  .description('inject env variables into your application process')
  .option('-f, --env-file <paths...>', 'path to your env file', '.env')
  .option('-o, --overload', 'override existing env variables')
  .action(function () {
    const options = this.opts()
    logger.debug('configuring options')
    logger.debug(options)

    // convert to array if needed
    let optionEnvFile = options.envFile
    if (!Array.isArray(optionEnvFile)) {
      optionEnvFile = [optionEnvFile]
    }

    const env = {}
    const readableFilepaths = new Set()
    const written = new Set()

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)

      logger.verbose(`injecting env from ${filepath}`)

      try {
        logger.debug(`reading env from ${filepath}`)
        const src = fs.readFileSync(filepath, { encoding: ENCODING })

        logger.debug(`parsing env from ${filepath}`)
        const parsed = main.parse(src)

        logger.debug(`writing env from ${filepath}`)
        const result = main.write(process.env, parsed, options.overload)

        readableFilepaths.add(envFilepath)
        result.written.forEach(key => written.add(key))
      } catch (e) {
        logger.warn(e)
      }
    }

    if (readableFilepaths.size > 0) {
      logger.info(`injecting ${written.size} environment ${helpers.pluralize('variable', written.size)} from ${[...readableFilepaths]}`)
    }

    // Extract command and arguments after '--'
    const commandIndex = process.argv.indexOf('--')
    if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
      logger.error('at least one argument is required after the run command, received 0.')
      logger.error('exiting')
      process.exit(1)
    } else {
      const subCommand = process.argv.slice(commandIndex + 1)

      helpers.executeCommand(subCommand, env)
    }
  })

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .action(function () {
    logger.info('encrypting')

    const data = keys.data()
    const filename = keys.filename()

    fs.writeFileSync(filename, data)
  })

program.parse(process.argv)
