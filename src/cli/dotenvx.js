#!/usr/bin/env node

/* c8 ignore start */
const { Command } = require('@dotenvx/tooling')
const program = new Command()

const { setLogLevel } = require('../shared/logger')
const help = require('./help')
const packageJson = require('./../lib/helpers/packageJson')
const executeDynamic = require('./../lib/helpers/executeDynamic')
const removeDynamicHelpSection = require('./../lib/helpers/removeDynamicHelpSection')
const removeOptionsHelpParts = require('./../lib/helpers/removeOptionsHelpParts')
const normalizeDotenvConfigQuiet = require('./../lib/helpers/normalizeDotenvConfigQuiet')

// for use with run
const envs = []
function collectEnvs (type) {
  return function (value, previous) {
    envs.push({ type, value })
    return (previous || []).concat([value])
  }
}

function collectEnvKeys (value, previous) {
  if (previous === undefined) return value
  if (Array.isArray(previous)) return previous.concat([value])

  return [previous, value]
}

// global log levels
program
  .usage('run -- yourcommand')
  .option('-l, --log-level <level>', 'set log level', 'info')
  .option('-q, --quiet', 'sets log level to error')
  .option('-v, --verbose', 'sets log level to verbose')
  .option('-d, --debug', 'sets log level to debug')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = normalizeDotenvConfigQuiet(thisCommand.opts())

    setLogLevel(options)
  })

// for dynamic loading of dotenvx-armor, etc
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
  .addHelpText('after', help.run)
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path(s) to your .env.keys file(s) (default: same path as your env file)', collectEnvKeys)
  .option('--redact', 'redact injected values except keys ending in _PLAIN', false)
  .option('-o, --overload', 'override existing env variables (by default, existing env vars take precedence over .env files)')
  .option('--validate', 'validate against .env.example', false)
  .option('--strict', 'process.exit(1) on any errors', false)
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\', \'flow\'])')
  .option('--ignore <errorCodes...>', 'error code(s) to ignore (example: --ignore=MISSING_ENV_FILE)')
  .option('--token <token>', 'set Armor ⛨ token')
  .option('--mask [characters]', 'inject masked values, optionally setting visible characters')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .option('--no-1password', 'disable 1Password secret reference resolution')
  .option('--no-bitwarden', 'disable Bitwarden secret reference resolution')
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
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path(s) to your .env.keys file(s) (default: same path as your env file)', collectEnvKeys)
  .option('-o, --overload', 'override existing env variables (by default, existing env vars take precedence over .env files)')
  .option('--strict', 'process.exit(1) on any errors', false)
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\', \'flow\'])')
  .option('--ignore <errorCodes...>', 'error code(s) to ignore (example: --ignore=MISSING_ENV_FILE)')
  .option('-a, --all', 'include all machine envs as well')
  .option('-ik, --include-key <includeKeys...>', 'keys(s) to include in output (default: all)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from output (default: none)')
  .option('--mask [characters]', 'mask values, optionally setting visible characters')
  .option('-pp, --pretty-print', 'pretty print output')
  .option('--pp', 'pretty print output (alias)')
  .option('--format <type>', 'format of the output (json, shell, colon, eval, eval-export)', 'json')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .option('--no-1password', 'disable 1Password secret reference resolution')
  .option('--no-bitwarden', 'disable Bitwarden secret reference resolution')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/get').apply(this, args)
  })

// dotenvx set
program.command('set')
  .usage('<KEY> [value] [options]')
  .description('encrypt a single environment variable')
  .addHelpText('after', help.set)
  .allowUnknownOption()
  .argument('KEY', 'KEY')
  .argument('[value]', 'value')
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-c, --encrypt', 'encrypt value', true)
  .option('-p, --plain', 'store value as plain text', false)
  .option('--no-create', 'do not create .env file(s) when missing')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/set').apply(this, args)
  })

// dotenvx encrypt
program.command('encrypt')
  .description('encrypt .env file(s)')
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path to your .env.keys file (default: same path as your env file)')
  .option('-k, --key <keys...>', 'keys(s) to encrypt (default: all keys in file)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from encryption (default: none)')
  .option('--stdout', 'send to stdout')
  .option('--token <token>', 'set Armor ⛨ token')
  .option('--no-create', 'do not create .env file(s) when missing')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/encrypt').apply(this, args)
  })

// dotenvx decrypt
program.command('decrypt')
  .description('decrypt .env file(s)')
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path(s) to your .env.keys file(s) (default: same path as your env file)', collectEnvKeys)
  .option('-k, --key <keys...>', 'keys(s) to decrypt (default: all keys in file)')
  .option('-ek, --exclude-key <excludeKeys...>', 'keys(s) to exclude from decryption (default: none)')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .option('--stdout', 'send to stdout')
  .option('--mask [characters]', 'mask stdout values, optionally setting visible characters')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/decrypt').apply(this, args)
  })

// dotenvx keypair
program.command('keypair')
  .usage('[KEY] [options]')
  .description('print public/private keys for .env file(s)')
  .argument('[KEY]', 'environment variable key name')
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'))
  .option('-fk, --env-keys-file <path>', 'path(s) to your .env.keys file(s) (default: same path as your env file)', collectEnvKeys)
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
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
  .option('--json', 'output a JSON array of absolute filepaths')
  .action(function (...args) {
    return require('./actions/ls').apply(this, args)
  })

// dotenvx validate
program.command('validate')
  .description('validate .env file(s) against .env.example')
  .option('-e, --env <strings...>', 'environment variable(s) set as string (example: "HELLO=World")', collectEnvs('env'), [])
  .option('-f, --env-file <path>', 'path(s) to your env file(s)', collectEnvs('envFile'), [])
  .option('-fk, --env-keys-file <path>', 'path(s) to your .env.keys file(s) (default: same path as your env file)', collectEnvKeys)
  .option('-o, --overload', 'override existing env variables (by default, existing env vars take precedence over .env files)')
  .option('--convention <name>', 'load a .env convention (available conventions: [\'nextjs\', \'flow\'])')
  .option('--ignore <errorCodes...>', 'error code(s) to ignore (example: --ignore=MISSING_ENV_FILE)')
  .option('--token <token>', 'set Armor ⛨ token')
  .option('--no-armor', 'disable Dotenvx Armor features')
  .option('--no-native', 'disable OS secret store features')
  .option('--no-1password', 'disable 1Password secret reference resolution')
  .option('--no-bitwarden', 'disable Bitwarden secret reference resolution')
  .action(function (...args) {
    this.envs = envs
    return require('./actions/validate').apply(this, args)
  })

// dotenvx gitignore
program.command('gitignore')
  .description('append to .gitignore')
  .addHelpText('after', help.gitignore)
  .option('--pattern <patterns...>', 'pattern(s) to gitignore', ['.env*'])
  .action(function (...args) {
    return require('./actions/ext/gitignore').apply(this, args)
  })

// dotenvx genexample
program.command('genexample')
  .description('generate .env.example')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(function (...args) {
    return require('./actions/ext/genexample').apply(this, args)
  })

// dotenvx precommit
program.command('precommit')
  .description('prevent committing .env files to code')
  .addHelpText('after', help.precommit)
  .argument('[directory]', 'directory to prevent committing .env files from', '.')
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(function (...args) {
    return require('./actions/ext/precommit').apply(this, args)
  })

// dotenvx prebuild
program.command('prebuild')
  .description('prevent including .env files in docker')
  .addHelpText('after', help.prebuild)
  .argument('[directory]', 'directory to prevent including .env files from', '.')
  .action(function (...args) {
    return require('./actions/ext/prebuild').apply(this, args)
  })

// dotenvx doctor
program.command('doctor', { hidden: true })
  .description('scan for dotenv loaders')
  .argument('[directory]', 'directory to scan', '.')
  .action(function (...args) {
    return require('./actions/doctor').apply(this, args)
  })

// dotenvx update
program.command('update')
  .description('update dotenvx')
  .action(function (...args) {
    return require('./actions/update').apply(this, args)
  })

// dotenvx login (compatibility alias for dotenvx armor login)
program.command('login', { hidden: true })
  .description('log in to move keys off-device, share with your team, and audit access')
  .allowUnknownOption()
  .option('--hostname <hostname>', 'set Armor ⛨ hostname')
  .action(function (...args) {
    return require('./actions/login').apply(this, args)
  })

// dotenvx logout (compatibility alias for dotenvx armor logout)
program.command('logout', { hidden: true })
  .description('log out of connected security features')
  .allowUnknownOption()
  .option('--hostname <hostname>', 'set Armor ⛨ hostname')
  .action(function (...args) {
    return require('./actions/logout').apply(this, args)
  })

// dotenvx curl
program.command('curl', { hidden: true })
  .description('Dotenvx Armor API')
  .addHelpText('after', help.curl)
  .argument('[url]', '(run dotenvx curl --help for list of urls)')
  .option('-X, --request <method>', 'HTTP request method')
  .option('--data <json>', 'JSON request body')
  .option('--token <token>', 'set token')
  .action(function (...args) {
    if (!this.args[0]) {
      this.outputHelp()
      return
    }

    return require('./actions/curl').apply(this, args)
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

// dotenvx armor
program.addHelpText('after', ' ')
program.addHelpText('after', 'Professional Security: ')
program.addHelpText('after', '  lock                     ⊡ lock private keys with a local passphrase')
program.addHelpText('after', '  native                   ⌥ move private keys into your OS secret store')
program.addHelpText('after', '  armor                    ⛨ move private keys into Dotenvx Armor [www.dotenvx.com/armor]')
program.addHelpText('after', '  curl                     ⛨ call authenticated api to Dotenvx Armor [www.dotenvx.com/armor]')

// dotenvx native
require('./commands/native')(program.command('native', { hidden: true }))

// dotenvx lock
require('./commands/lock')(program.command('lock', { hidden: true }))

// dotenvx armor
require('./commands/armor')(program.command('armor', { hidden: true }))

// dotenvx ext
program.addCommand(require('./commands/ext'))

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
    !line.includes('🔌 extensions')
  )

  return filteredLines.join('\n')
}
/* c8 ignore stop */

program.parse(process.argv)
