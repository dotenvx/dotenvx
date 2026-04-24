#!/usr/bin/env node

/* c8 ignore start */
const { Command, Option } = require('commander')
const program = new Command()

const { setLogLevel, logger } = require('../shared/logger')
const examples = require('./examples')
const packageJson = require('./../lib/helpers/packageJson')
const Errors = require('./../lib/helpers/errors')
const getCommanderVersion = require('./../lib/helpers/getCommanderVersion')
const executeDynamic = require('./../lib/helpers/executeDynamic')
const removeDynamicHelpSection = require('./../lib/helpers/removeDynamicHelpSection')
const removeOptionsHelpParts = require('./../lib/helpers/removeOptionsHelpParts')

// for use with run
const envs = []
function collectEnvs (type) {
  return function (value, previous) {
    envs.push({ type, value })
    return previous.concat([value])
  }
}

// surface hoisting problems
const commanderVersion = getCommanderVersion()
if (commanderVersion && parseInt(commanderVersion.split('.')[0], 10) >= 12) {
  const message = `dotenvx depends on commander@11.x.x but you are attempting to hoist commander@${commanderVersion}`
  const error = new Errors({ message }).dangerousDependencyHoist()
  logger.error(error.messageWithHelp)
}

// global log levels
program
  .usage('run -- yourcommand')
  .option('-l, --log-level <level>', 'set log level', 'info')
  .option('-q, --quiet', 'sets log level to error')
  .option('-v, --verbose', 'sets log level to verbose')
  .option('-d, --debug', 'sets log level to debug')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = thisCommand.opts()

    setLogLevel(options)
  })

// for dynamic loading of dotenvx-ops, etc
program
  .argument('[command]', 'dynamic command')
  .argument('[args...]', 'dynamic command arguments')
  .action((command, args, cmdObj) => {
    const rawArgs = process.argv.slice(3) // adjust the index based on where actual args start
    executeDynamic(program, command, rawArgs)
  })

// cli
program
  .name('dotenvx')
  .description(packageJson.description)
  .version(packageJson.version)
  .allowUnknownOption()

// dotenvx run -- node index.js
program.command('run')
  .description('inject env at runtime [dotenvx run -- yourcommand]')
  .addHelpText('after', examples.run)
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-o, --overload', 'override existing env variables (by default, existing env vars take precedence over .env files)')
  .option('--strict', 'process.exit(1) on any errors', false)
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\', \'flow\'])')
  .option('--ignore <errorCodes...>', 'error code(s) to ignore (example: --ignore=MISSING_ENV_FILE)')
  .option('--no-ops', 'disable dotenvx-ops features')
  .addOption(new Option('--ops-off', 'DEPRECATED: use --no-ops').hideHelp())
  .action(function (...args) {
    this.envs = envs
    return require('./actions/run').apply(this, args)
  })

// dotenvx get
program.command('get')
  .usage('[KEY] [options]')
  .description('return a single environment variable')
  .argument('[KEY]', 'environment variable name')
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-o, --overload', 'override existing env variables (by default, existing env vars take precedence over .env files)')
  .option('--strict', 'process.exit(1) on any errors', false)
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\', \'flow\'])')
  .option('--ignore <errorCodes...>', 'error code(s) to ignore (example: --ignore=MISSING_ENV_FILE)')
  .option('-a, --all', 'include all machine envs as well')
  .option('-pp, --pretty-print', 'pretty print output')
  .option('--pp', 'pretty print output (alias)')
  .option('--format <type>', 'format of the output (json, shell, colon, eval)', 'json')
  .option('--no-ops', 'disable dotenvx-ops features')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/get').apply(this, args)
  })

// dotenvx set
program.command('set')
  .usage('<KEY> <value> [options]')
  .description('encrypt a single environment variable')
  .addHelpText('after', examples.set)
  .allowUnknownOption()
  .argument('KEY', 'KEY')
  .argument('value', 'value')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-c, --encrypt', 'encrypt value', true)
  .option('-p, --plain', 'store value as plain text', false)
  .option('--no-create', 'do not create .env file(s) when missing')
  .option('--no-ops', 'disable dotenvx-ops features')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/set').apply(this, args)
  })

// dotenvx encrypt
program.command('encrypt')
  .description('convert .env file(s) to encrypted .env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-k, --key <keys...>', 'keys(s) to encrypt (default: all keys in file)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from encryption (default: none)')
  .option('--stdout', 'send to stdout')
  .option('--no-create', 'do not create .env file(s) when missing')
  .option('--no-ops', 'disable dotenvx-ops features')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/encrypt').apply(this, args)
  })

// dotenvx decrypt
program.command('decrypt')
  .description('convert encrypted .env file(s) to plain .env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-k, --key <keys...>', 'keys(s) to decrypt (default: all keys in file)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from decryption (default: none)')
  .option('--no-ops', 'disable dotenvx-ops features')
  .option('--stdout', 'send to stdout')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/decrypt').apply(this, args)
  })

// dotenvx rotate
program.command('rotate')
  .description('rotate keypair(s) and re-encrypt .env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-k, --key <keys...>', 'keys(s) to encrypt (default: all keys in file)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from encryption (default: none)')
  .option('--no-ops', 'disable dotenvx-ops features')
  .option('--stdout', 'send to stdout')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/rotate').apply(this, args)
  })

// dotenvx keypair
program.command('keypair')
  .usage('[KEY] [options]')
  .description('print public/private keys for .env file(s)')
  .argument('[KEY]', 'environment variable key name')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('--no-ops', 'disable dotenvx-ops features')
  .option('-pp, --pretty-print', 'pretty print output')
  .option('--pp', 'pretty print output (alias)')
  .option('--format <type>', 'format of the output (json, shell, colon)', 'json')
  .action(function (...args) {
    return require('./actions/keypair').apply(this, args)
  })

// dotenvx ls
program.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .option('-ef, --exclude-env-file <excludeFilenames...>', 'path(s) to exclude from your env file(s) (default: none)')
  .action(function (...args) {
    return require('./actions/ls').apply(this, args)
  })

// dotenvx login
program.command('login')
  .description('log in to unlock ⛨ ARMORED KEYS ✦ BETA')
  .allowUnknownOption()
  .action(() => {
    const rawArgs = ['ops', 'login', ...process.argv.slice(3)]
    executeDynamic(program, 'ops', rawArgs)
  })

// dotenvx logout
program.command('logout', { hidden: true })
  .description('optional: log out of your dotenvx account')
  .allowUnknownOption()
  .action(() => {
    const rawArgs = ['ops', 'logout', ...process.argv.slice(3)]
    executeDynamic(program, 'ops', rawArgs)
  })

// dotenvx help
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

// dotenvx ops
program.addHelpText('after', ' ')
program.addHelpText('after', 'Advanced: ')
program.addHelpText('after', '  ops                ⛨  Ops [www.dotenvx.com/ops]')
program.addHelpText('after', '  ext                🔌 extensions')

// dotenvx ext
program.addCommand(require('./commands/ext'))

//
// MOVED
//
program.command('prebuild')
  .description('DEPRECATED: moved to [dotenvx ext prebuild]')
  .addHelpText('after', examples.prebuild)
  .argument('[directory]', 'directory to prevent including .env files from', '.')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [prebuild] has moved to [dotenvx ext prebuild]')

    require('./actions/ext/prebuild').apply(this, args)
  })

program.command('precommit')
  .description('DEPRECATED: moved to [dotenvx ext precommit]')
  .addHelpText('after', examples.precommit)
  .argument('[directory]', 'directory to prevent committing .env files from', '.')
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [precommit] has moved to [dotenvx ext precommit]')

    require('./actions/ext/precommit').apply(this, args)
  })

// override helpInformation to hide DEPRECATED and 'ext' commands
program.helpInformation = function () {
  const originalHelp = Command.prototype.helpInformation.call(this)
  const lines = originalHelp.split('\n')

  removeDynamicHelpSection(lines)
  removeOptionsHelpParts(lines)

  // Filter out the hidden command from the help output
  const filteredLines = lines.filter(line =>
    !line.includes('DEPRECATED') &&
    !line.includes('help [command]') &&
    !line.includes('🔌 extensions') &&
    !/^\s*ls\b/.test(line)
  )

  return filteredLines.join('\n')
}
/* c8 ignore stop */

program.parse(process.argv)
