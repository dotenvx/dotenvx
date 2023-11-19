#!/usr/bin/env node

const fs = require('fs')
const { Command } = require('commander')
const program = new Command()

// constants
const ENCODING = 'utf8'

const logger = require('./../shared/logger')
const helpers = require('./helpers')
const packageJson = require('./../shared/packageJson')
const main = require('./../lib/main')

// global log levels
program
  .option('-l, --log-level <level>', 'set log level', 'info')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = thisCommand.opts()

    if (options.logLevel) {
      logger.level = options.logLevel
      logger.debug(`Setting log level to ${options.logLevel}`)
    }
  })

// cli
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

// commands
program.command('encrypt')
  .description('encrypt something')
  .action((_str, _options) => {
    console.log('encrypted!')
  })

program.command('decrypt')
  .description('decrypt something')
  .action((_str, _options) => {
    console.log('decrypted!')
  })

program.command('run')
  .description('Inject env variables into your application process')
  .option('-f, --env-file <paths...>', 'path to your env file', '.env')
  .option('-o, --overload', 'override existing env variables')
  .action(function () {
    // injecting 1 environment variable from ${options.envFile}
    const options = this.opts()
    logger.debug('Configuring options')
    logger.debug(options)

    // convert to array if needed
    let optionEnvFile = options.envFile
    if (!Array.isArray(optionEnvFile)) {
      optionEnvFile = [optionEnvFile]
    }

    const env = {}

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)

      logger.verbose(`Loading env from ${filepath}`)

      try {
        logger.debug(`Reading env from ${filepath}`)
        const src = fs.readFileSync(filepath, { encoding: ENCODING })

        logger.debug(`Parsing env from ${filepath}`)
        const parsed = main.parse(src)

        logger.debug(`Populating env from ${filepath}`)
        main.populate(process.env, parsed, { debug: (logger.level === 'debug'), override: options.overload })
      } catch (e) {
        logger.warn(e)
      }
    }

    logger.info('Injecting X environment variables into your application process')

    // Extract command and arguments after '--'
    const commandIndex = process.argv.indexOf('--')
    if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
      logger.error('Error: No command provided after --.')
      process.exit(1)
    }

    const command = process.argv[commandIndex + 1]
    const args = process.argv.slice(commandIndex + 2)

    helpers.executeCommand(command, args, env)
  })

program.parse(process.argv)
