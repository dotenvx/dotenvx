const path = require('path')
const childProcess = require('child_process')
const { logger } = require('../../shared/logger')

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
    if (command === 'pro') {
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx-${command}] commands 🏆`)
      logger.warn('[DEPRECATION NOTICE] dotenvx-pro to be sunsetted soon (2026) and its featureset to be rolled into dotenvx-ops')
      logger.help('? see installation instructions [https://github.com/dotenvx/dotenvx-pro]')
    } else if (command === 'ops') {
      const ops = ` _______________________________________________________________________
|                                                                       |
|  Dotenvx Ops: Commercial Tooling for Dotenvx                          |
|                                                                       |
|  ░▒▓██████▓▒░░▒▓███████▓▒░ ░▒▓███████▓▒░                              |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                     |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                     |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░ ░▒▓██████▓▒░                               |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░                              |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░                              |
|  ░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓███████▓▒░                               |
|                                                                       |
|  Use dotenvx across your team, infrastructure, agents, and more.      |
|                                                                       |
|  Learn more at https://dotenvx.com/ops                                |
|                                                                       |
| --------------------------------------------------------------------- |
| - thank you for using dotenvx! - @motdotla                            |
|_______________________________________________________________________|`

      console.log(ops)
      console.log('')
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx ${command}] 🏰`)
      logger.help('? see installation instructions [https://dotenvx.com/ops]')
    } else if (command === 'radar') {
      const radar = ` _______________________________________________________________________
|                                                                       |
|  Dotenvx Radar: Env Observability                                     |
|                                                                       |
|  ░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░    |
|  ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░   |
|  ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░   |
|  ░▒▓███████▓▒░░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓███████▓▒░    |
|  ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░   |
|  ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░   |
|  ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░   |
|                                                                       |
|  Observe, version, and back up your environment variables at runtime. |
|                                                                       |
|  Purchase lifetime access at https://dotenvx.com/radar                |
|                                                                       |
| --------------------------------------------------------------------- |
| - thank you for using dotenvx! - @motdotla                            |
|_______________________________________________________________________|`

      console.log(radar)
      console.log('')
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx ${command}] 📡`)
      logger.help('? see installation instructions [https://dotenvx.com/radar]')
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeDynamic
