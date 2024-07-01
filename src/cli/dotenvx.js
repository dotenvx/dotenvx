#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { Command } = require('commander')
const program = new Command()

const { setLogLevel, logger } = require('../shared/logger')
const examples = require('./examples')
const packageJson = require('./../lib/helpers/packageJson')

// for use with run
const envs = []
function collectEnvs (type) {
  return function (value, previous) {
    envs.push({ type, value })
    return previous.concat([value])
  }
}

// global log levels
program
  .option('-l, --log-level <level>', 'set log level', 'info')
  .option('-q, --quiet', 'sets log level to error')
  .option('-v, --verbose', 'sets log level to verbose')
  .option('-d, --debug', 'sets log level to debug')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = thisCommand.opts()

    setLogLevel(options)
  })

// cli
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)

// dotenvx run -- node index.js
const runAction = require('./actions/run')
program.command('run')
  .description('inject env at runtime [dotenvx run -- yourcommand]')
  .addHelpText('after', examples.run)
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fv, --env-vault-file <paths...>', 'path(s) to your .env.vault file(s)', collectEnvs('envVaultFile'), [])
  .option('-o, --overload', 'override existing env variables')
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\'])')
  .action(function (...args) {
    this.envs = envs

    runAction.apply(this, args)
  })

// dotenvx get
const getAction = require('./actions/get')
program.command('get')
  .description('return a single environment variable')
  .argument('[key]', 'environment variable name')
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fv, --env-vault-file <paths...>', 'path(s) to your .env.vault file(s)', collectEnvs('envVaultFile'), [])
  .option('-o, --overload', 'override existing env variables')
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\'])')
  .option('-a, --all', 'include all machine envs as well')
  .option('-pp, --pretty-print', 'pretty print output')
  .action(function (...args) {
    this.envs = envs

    getAction.apply(this, args)
  })

// dotenvx set
const setAction = require('./actions/set')
program.command('set')
  .description('set a single environment variable')
  .addHelpText('after', examples.set)
  .allowUnknownOption()
  .argument('KEY', 'KEY')
  .argument('value', 'value')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .option('-c, --encrypt', 'encrypt value (default: true)', true)
  .option('-p, --plain', 'store value as plain text', false)
  .action(setAction)

// dotenvx encrypt
const encryptAction = require('./actions/encrypt')
program.command('encrypt')
  .description('convert .env file(s) to encrypted .env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .option('-k, --key <keys...>', 'keys(s) to encrypt (default: all keys in file)')
  .action(encryptAction)

// dotenvx pro
program.command('pro')
  .description('🏆 pro')
  .action(function (...args) {
    try {
      // execute `dotenvx-pro` if available
      execSync('dotenvx-pro', { stdio: ['inherit', 'inherit', 'ignore'] })
    } catch (_error) {
      const pro = fs.readFileSync(path.join(__dirname, './pro.txt'), 'utf8')

      console.log(pro)
    }
  })

// // dotenvx ent
// program.command('ent')
//   .description('🏢 enterprise')
//   .action(function (...args) {
//     console.log('coming soon (med-large companies)')
//   })

// dotenvx ext
program.addCommand(require('./commands/ext'))

//
// DEPRECATED AND hidden
//
program.addCommand(require('./commands/vault'))

program.command('convert')
  .description('DEPRECATED: moved to [dotenvx encrypt]')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx convert] has moved to [dotenvx encrypt]')

    encryptAction.apply(this, args)
  })

const lsAction = require('./actions/ext/ls')
program.command('ls')
  .description('DEPRECATED: moved to [dotenvx ext ls]')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [ls] has moved to [dotenvx ext ls]')

    lsAction.apply(this, args)
  })

const genexampleAction = require('./actions/ext/genexample')
program.command('genexample')
  .description('DEPRECATED: moved to [dotenvx ext genexample]')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [genexample] has moved to [dotenvx ext genexample]')

    genexampleAction.apply(this, args)
  })

// dotenvx gitignore
const gitignoreAction = require('./actions/ext/gitignore')
program.command('gitignore')
  .description('DEPRECATED: moved to [dotenvx ext gitignore]')
  .addHelpText('after', examples.gitignore)
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [gitignore] has moved to [dotenvx ext gitignore]')

    gitignoreAction.apply(this, args)
  })

// dotenvx prebuild
const prebuildAction = require('./actions/ext/prebuild')
program.command('prebuild')
  .description('DEPRECATED: moved to [dotenvx ext prebuild]')
  .addHelpText('after', examples.prebuild)
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [prebuild] has moved to [dotenvx ext prebuild]')

    prebuildAction.apply(this, args)
  })

// dotenvx precommit
const precommitAction = require('./actions/ext/precommit')
program.command('precommit')
  .description('DEPRECATED: moved to [dotenvx ext precommit]')
  .addHelpText('after', examples.precommit)
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [precommit] has moved to [dotenvx ext precommit]')

    precommitAction.apply(this, args)
  })

// dotenvx scan
const scanAction = require('./actions/ext/scan')
program.command('scan')
  .description('DEPRECATED: moved to [dotenvx ext scan]')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [scan] has moved to [dotenvx ext scan]')

    scanAction.apply(this, args)
  })

// overide helpInformation to hide DEPRECATED commands
program.helpInformation = function () {
  const originalHelp = Command.prototype.helpInformation.call(this)
  const lines = originalHelp.split('\n')

  // Filter out the hidden command from the help output
  const filteredLines = lines.filter(line => !line.includes('DEPRECATED'))

  return filteredLines.join('\n')
}

program.parse(process.argv)
