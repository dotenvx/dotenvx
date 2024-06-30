const path = require('path')
const { spawnSync } = require('child_process')
const { Command } = require('commander')
const { logger } = require('../../shared/logger')

const examples = require('./../examples')

const ext = new Command('ext')

ext
  .description('🔌 extensions')
  .allowUnknownOption()
  .argument('[command]', 'dynamic external extension')
  .argument('[args...]', 'arguments for dynamic external extension')
  .action((command, args, cmdObj) => {
    logger.debug(`command: ${command}`)
    logger.debug(`args: ${JSON.stringify(args)}`)

    // output help and exit code 1
    if (!command) {
      ext.outputHelp()
      process.exit(1)
    }

    // include node_modules/.bin in path
    const binPath = path.join(process.cwd(), 'node_modules', '.bin')
    const newPath = `${binPath}:${process.env.PATH}`
    const env = { ...process.env, PATH: newPath }

    // attempt to run the extension
    const result = spawnSync(`dotenvx-ext-${command}`, args, { stdio: 'inherit', env })
    if (result.error) {
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-ext-${command} to use [dotenvx ext ${command}] commands`)
      logger.help(`install with npm [npm install @dotenvx/dotenvx-ext-${command}] or with curl [curl -sfS https://dotenvx.sh/ext/${command} | sh]`)
    }
    if (result.status !== 0) {
      // do nothing
    } else {
      // do nothing
    }
  })

// dotenvx ext ls
ext.command('ls')
  .description('print all .env files in a tree structure')
  .argument('[directory]', 'directory to list .env files from', '.')
  .option('-f, --env-file <filenames...>', 'path(s) to your env file(s)', '.env*')
  .action(require('./../actions/ext/ls'))

// dotenvx ext genexample
ext.command('genexample')
  .description('generate .env.example')
  .argument('[directory]', 'directory to generate from', '.')
  .option('-f, --env-file <paths...>', 'path(s) to your env file(s)', '.env')
  .action(require('./../actions/ext/genexample'))

// dotenvx ext gitignore
ext.command('gitignore')
  .description('append to .gitignore file (and if existing, .dockerignore, .npmignore, and .vercelignore)')
  .addHelpText('after', examples.gitignore)
  .action(require('./../actions/ext/gitignore'))

// dotenvx ext prebuild
ext.command('prebuild')
  .description('prevent including .env files in docker builds')
  .addHelpText('after', examples.prebuild)
  .action(require('./../actions/ext/prebuild'))

// dotenvx ext precommit
ext.command('precommit')
  .description('prevent committing .env files to code')
  .addHelpText('after', examples.precommit)
  .option('-i, --install', 'install to .git/hooks/pre-commit')
  .action(require('./../actions/ext/precommit'))

// dotenvx scan
ext.command('scan')
  .description('scan for leaked secrets')
  .action(require('./../actions/ext/scan'))

// dotenvx settings
ext.command('settings')
  .description('print current dotenvx settings')
  .argument('[key]', 'settings name')
  .option('-pp, --pretty-print', 'pretty print output')
  .action(require('./../actions/ext/settings'))

ext.addCommand(require('./../commands/ext/vault'))

module.exports = ext
