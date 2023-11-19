#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { Command } = require('commander')
const program = new Command()
const dotenv = require('dotenv')

// constants
const ENCODING = 'utf8'

const logger = require('./src/logger')
const helpers = require('./src/helpers')
const packageJson = require('./src/packageJson')

// global log levels
program
  .option('-l, --log-level <level>', 'set log level', 'info')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = thisCommand.opts()

    if (options.logLevel) {
      logger.level = options.logLevel
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
    logger.info('INFO!')
    logger.debug('DEBUG!')
    logger.verbose('VERBOSE!')

    console.log('encrypted!')
  })

program.command('decrypt')
  .description('decrypt something')
  .action((_str, _options) => {
    console.log('decrypted!')
  })

program.command('run')
  .description('Inject environment variables into your application process')
  .option('-f, --env-file <paths...>', 'path to your environment file', '.env')
  .action(function() {
    // injecting 1 environment variable from ${options.envFile}

    const options = this.opts()
    logger.debug(options)

    // convert to array if needed
    let optionEnvFile = options.envFile
    if (!Array.isArray(optionEnvFile)) {
      optionEnvFile = [optionEnvFile]
    }

    const env = {}

    for (const envFilepath of optionEnvFile) {
      logger.verbose(`parsing ${envFilepath}`)
      const filepath = helpers.resolvePath(envFilepath)

      try {
        const contents = fs.readFileSync(filepath, { encoding: ENCODING })
        const parsed = dotenv.parse(contents)
        logger.debug(parsed)

      } catch (e) {
        logger.warn(e)
      }
    }

    // Extract command and arguments after '--'
    const commandIndex = process.argv.indexOf('--')
    if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
      console.error('Error: No command provided after --.')
      process.exit(1)
    }

    const command = process.argv[commandIndex + 1]
    const args = process.argv.slice(commandIndex + 2)

    helpers.executeCommand(command, args, env)
  })

program.parse(process.argv)
