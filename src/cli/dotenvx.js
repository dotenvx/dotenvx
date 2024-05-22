#!/usr/bin/env node

const UpdateNotice = require('./../lib/helpers/updateNotice')
const { Command } = require('commander')
const program = new Command()

const { setLogLevel, logger } = require('../shared/logger')
const examples = require('./examples')
const packageJson = require('./../lib/helpers/packageJson')

// once a day check for any updates
const notice = new UpdateNotice()
notice.check()
if (notice.update) {
  logger.warn(`Update available ${notice.packageVersion} → ${notice.latestVersion} 0.38.0 and higher have SIGNIFICANT changes. please read the changelog: https://dotenvx.com/changelog`)
}

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
program.command('set')
  .description('set a single environment variable')
  .argument('KEY', 'KEY')
  .argument('value', 'value')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .option('-c, --encrypt', 'encrypt value')
  .action(require('./actions/set'))

// dotenvx convert
program.command('convert')
  .description('convert env file(s) to encrypted env file(s)')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(require('./actions/convert'))

// dotenvx ls
program.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(require('./actions/ls'))

// dotenvx genexample
program.command('genexample')
  .description('generate .env.example')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(require('./actions/genexample'))

// dotenvx gitignore
program.command('gitignore')
  .description('append to .gitignore file (and if existing, .dockerignore, .npmignore, and .vercelignore)')
  .addHelpText('after', examples.gitignore)
  .action(require('./actions/gitignore'))

// dotenvx prebuild
program.command('prebuild')
  .description('prevent including .env files in docker builds')
  .addHelpText('after', examples.prebuild)
  .action(require('./actions/prebuild'))

// dotenvx precommit
program.command('precommit')
  .description('prevent committing .env files to code')
  .addHelpText('after', examples.precommit)
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(require('./actions/precommit'))

// dotenvx scan
program.command('scan')
  .description('scan for leaked secrets')
  .action(require('./actions/scan'))

// dotenvx settings
program.command('settings')
  .description('print current dotenvx settings')
  .argument('[key]', 'settings name')
  .option('-pp, --pretty-print', 'pretty print output')
  .action(require('./actions/settings'))

// dotenvx vault
program.addCommand(require('./commands/vault'))

// dotenvx encrypt
const encryptAction = require('./actions/vault/encrypt')
program.command('encrypt')
  .description('DEPRECATED: moved to [dotenvx vault encrypt]')
  .addHelpText('after', examples.encrypt)
  .argument('[directory]', 'directory to encrypt', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx encrypt] has moved. change your command to [dotenvx vault encrypt]')
    logger.warn('DEPRECATION NOTICE: [dotenvx encryptme] will become [dotenvx encrypt] in a 1.0.0 release scheduled for middle of June 2024.')

    encryptAction.apply(this, args)
  })

// dotenvx decrypt
const decryptAction = require('./actions/vault/decrypt')
program.command('decrypt')
  .description('DEPRECATED: moved to [dotenvx vault decrypt]')
  .argument('[directory]', 'directory to decrypt', '.')
  .option('-e, --environment <environments...>', 'environment(s) to decrypt')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx decrypt] has moved. change your command to [dotenvx vault decrypt]')

    decryptAction.apply(this, args)
  })

// dotenvx status
const statusAction = require('./actions/vault/status')
program.command('status')
  .description('DEPRECATED: moved to [dotenvx vault status]')
  .argument('[directory]', 'directory to check status against', '.')
  .action(function (...args) {
    logger.warn('DEPRECATION NOTICE: [dotenvx status] has moved. change your command to [dotenvx vault status]')

    statusAction.apply(this, args)
  })

// dotenvx hub
program.addCommand(require('./commands/hub'))

program.parse(process.argv)
