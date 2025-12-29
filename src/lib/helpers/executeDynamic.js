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
    if (command === 'radar') {
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx ${command}] 📡`)
      logger.warn('[DEPRECATION NOTICE] dotenvx-radar to be sunsetted soon (2026) and its featureset to be rolled into dotenvx-ops')
      logger.help('? see installation instructions [https://dotenvx.com/radar]')
    } else if (command === 'ops') {
      const ops = ` _______________________________________________________________________
|                                                                       |
|  dotenvx-ops: production grade dotenvx–with operational primitives    |
|                                                                       |
|  ░▒▓██████▓▒░░▒▓███████▓▒░ ░▒▓███████▓▒░                              |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                     |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░                                     |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓███████▓▒░ ░▒▓██████▓▒░                               |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░                              |
| ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░                              |
|  ░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓███████▓▒░                               |
|                                                                       |
|  Learn more at https://dotenvx.com/ops                                |
|_______________________________________________________________________|`

      console.log(ops)
      console.log('')
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx ${command}] 🏰`)
      logger.help('⮕  next run: [curl -sfS https://dotenvx.sh/ops | sh]')
      logger.help('⮕  see more: [https://dotenvx.com/ops]')
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeDynamic
