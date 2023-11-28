#!/usr/bin/env node

const fs = require('fs')
const { Command } = require('commander')
const dotenv = require('dotenv')
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
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
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
      process.exit(1)
    } else {
      const subCommand = process.argv.slice(commandIndex + 1)

      helpers.executeCommand(subCommand, env)
    }
  })

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env.* to .env.vault')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', helpers.findEnvFiles('./'))
  .action(function () {
    const options = this.opts()
    logger.debug('configuring options')
    logger.debug(options)

    let optionEnvFile = options.envFile
    if (!Array.isArray(optionEnvFile)) {
      optionEnvFile = [optionEnvFile]
    }

    try {
      logger.verbose(`generating .env.keys from ${optionEnvFile}`)

      const dotenvKeys = (dotenv.configDotenv({ path: '.env.keys' }).parsed || {})

      for (const envFilepath of optionEnvFile) {
        const filepath = helpers.resolvePath(envFilepath)
        if (!fs.existsSync(filepath)) {
          throw new Error(`file does not exist: ${filepath}`)
        }

        const environment = helpers.guessEnvironment(filepath)
        const key = `DOTENV_KEY_${environment.toUpperCase()}`

        let value = dotenvKeys[key]

        // first time seeing new DOTENV_KEY_${environment}
        if (!value || value.length === 0) {
          logger.verbose(`generating ${key}`)
          value = helpers.generateDotenvKey(environment)
          logger.debug(`generating ${key} as ${value}`)

          dotenvKeys[key] = value
        } else {
          logger.verbose(`existing ${key}`)
          logger.debug(`existing ${key} as ${value}`)
        }
      }

      let keysData = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
  #/   DOTENV_KEYs. DO NOT commit to source control   /
  #/   [how it works](https://dotenv.org/env-keys)    /
  #/--------------------------------------------------/\n`

      for (const key in dotenvKeys) {
        const value = dotenvKeys[key]
        keysData += `${key}="${value}"\n`
      }

      fs.writeFileSync('.env.keys', keysData)
    } catch (e) {
      logger.error(e)
      process.exit(1)
    }

    try {
      logger.verbose(`generating .env.vault from ${optionEnvFile}`)

      const dotenvKeys = (dotenv.configDotenv({ path: '.env.keys' }).parsed || {})
      const dotenvVaults = (dotenv.configDotenv({ path: '.env.vault' }).parsed || {})

      for (const envFilepath of optionEnvFile) {
        const filepath = helpers.resolvePath(envFilepath)
        const environment = helpers.guessEnvironment(filepath)
        const vault = `DOTENV_VAULT_${environment.toUpperCase()}`

        let ciphertext = dotenvVaults[vault]
        const dotenvKey = dotenvKeys[`DOTENV_KEY_${environment.toUpperCase()}`]

        if (!ciphertext || ciphertext.length === 0 || helpers.changed(ciphertext, dotenvKey, filepath, ENCODING)) {
          logger.verbose(`encrypting ${vault}`)
          ciphertext = helpers.encryptFile(filepath, dotenvKey, ENCODING)
          logger.verbose(`encrypting ${vault} as ${ciphertext}`)

          dotenvVaults[vault] = ciphertext
        } else {
          logger.verbose(`existing ${vault}`)
          logger.debug(`existing ${vault} as ${ciphertext}`)
        }
      }

      let vaultData = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenv.org/env-vault)   /
#/--------------------------------------------------/\n\n`

      for (const vault in dotenvVaults) {
        const value = dotenvVaults[vault]
        const environment = vault.replace('DOTENV_VAULT_', '').toLowerCase()
        vaultData += `# ${environment}\n`
        vaultData += `${vault}="${value}"\n\n`
      }

      fs.writeFileSync('.env.vault', vaultData)
    } catch (e) {
      logger.error(e)
      process.exit(1)
    }

    logger.info(`encrypted ${optionEnvFile} to .env.vault`)
  })

program.parse(process.argv)
