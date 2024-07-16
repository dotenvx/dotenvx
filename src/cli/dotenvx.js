#!/usr/bin/env node

/* c8 ignore start */
const { Command } = require('commander')
const program = new Command()

const { setLogLevel, logger } = require('../shared/logger')
const examples = require('./examples')
const packageJson = require('./../lib/helpers/packageJson')
const executeDynamic = require('./../lib/helpers/executeDynamic')

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

program.addHelpText('after', '  pro                               🏆 pro\n')

program
  .argument('[command]', 'dynamic command')
  .argument('[args...]', 'dynamic command arguments')
  .action((command, args, cmdObj) => {
    const rawArgs = process.argv.slice(3) // adjust the index based on where actual args start
    executeDynamic(program, command, rawArgs)
  })

// cli
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version)
  .allowUnknownOption()

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
  .option('--stdout', 'send to stdout')
  .action(encryptAction)

// dotenvx decrypt
const decryptAction = require('./actions/decrypt')
program.command('decrypt')
  .description('convert encrypted .env file(s) to plain .env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .option('-k, --key <keys...>', 'keys(s) to encrypt (default: all keys in file)')
  .option('--stdout', 'send to stdout')
  .action(decryptAction)

// dotenvx ext
program.addCommand(require('./commands/ext'))

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

program.command('help [command]')
  .description('display help for command')
  .action((command) => {
    if (command) {
      const subCommand = program.commands.find(c => c.name() === command)
      if (subCommand) {
        subCommand.outputHelp()
      } else {
        program.outputHelp()
      }
    } else {
      program.outputHelp()
    }
  })

// overide helpInformation to hide DEPRECATED commands
program.helpInformation = function () {
  const originalHelp = Command.prototype.helpInformation.call(this)
  const lines = originalHelp.split('\n')

  // Filter out the hidden command from the help output
  const filteredLines = lines.filter(line => !line.includes('DEPRECATED'))

  return filteredLines.join('\n')
}
/* c8 ignore stop */

program.parse(process.argv)
