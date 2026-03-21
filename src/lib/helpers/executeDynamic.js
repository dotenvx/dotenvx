const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')
const { logger } = require('../../shared/logger')

function installCommandForOps () {
  const userAgent = process.env.npm_config_user_agent || ''
  if (userAgent.startsWith('pnpm/')) return 'pnpm add -g @dotenvx/dotenvx-ops'
  if (userAgent.startsWith('yarn/')) return 'yarn global add @dotenvx/dotenvx-ops'
  if (userAgent.startsWith('npm/')) return 'npm i -g @dotenvx/dotenvx-ops'

  const cwd = process.cwd()
  if (fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'))) return 'pnpm add -g @dotenvx/dotenvx-ops'
  if (fs.existsSync(path.join(cwd, 'yarn.lock'))) return 'yarn global add @dotenvx/dotenvx-ops'
  if (
    fs.existsSync(path.join(cwd, 'package-lock.json')) ||
    fs.existsSync(path.join(cwd, 'npm-shrinkwrap.json'))
  ) return 'npm i -g @dotenvx/dotenvx-ops'

  if (fs.existsSync(path.join(cwd, 'package.json'))) return 'npm i -g @dotenvx/dotenvx-ops'

  return 'curl -sfS https://dotenvx.sh/ops | sh'
}

function opsBanner (installCommand) {
  const lines = [
    '',
    '   ██████╗ ██████╗ ███████╗',
    '  ██╔═══██╗██╔══██╗██╔════╝',
    '  ██║   ██║██████╔╝███████╗',
    '  ██║   ██║██╔═══╝ ╚════██║',
    '  ╚██████╔╝██║     ███████║',
    '   ╚═════╝ ╚═╝     ╚══════╝',
    '',
    '  KEYS OFF COMPUTER: Add hardened key protection with dotenvx-ops.',
    `  Install now: [${installCommand}]`,
    '  Learn more: [https://dotenvx.com/ops]'
  ]

  const innerWidth = Math.max(67, ...lines.map((line) => line.length))
  const top = ` ${'_'.repeat(innerWidth)}`
  const middle = lines.map((line) => `|${line.padEnd(innerWidth)}|`).join('\n')
  const bottom = `|${'_'.repeat(innerWidth)}|`

  return `${top}\n${middle}\n${bottom}`
}

function executeDynamic (program, command, rawArgs) {
  if (!command) {
    program.outputHelp()
    process.exit(1)
    return
  }

  // construct the full command line manually including flags
  const commandIndex = rawArgs.indexOf(command)
  const forwardedArgs = rawArgs.slice(commandIndex + 1)

  logger.debug(`command: ${command}`)
  logger.debug(`args: ${JSON.stringify(forwardedArgs)}`)

  const binPath = path.join(process.cwd(), 'node_modules', '.bin')
  const newPath = `${binPath}:${process.env.PATH}`
  const env = { ...process.env, PATH: newPath }

  const result = childProcess.spawnSync(`dotenvx-${command}`, forwardedArgs, { stdio: 'inherit', env })
  if (result.error) {
    if (command === 'ops') {
      const installCommand = installCommandForOps()
      console.log(opsBanner(installCommand))
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeDynamic
