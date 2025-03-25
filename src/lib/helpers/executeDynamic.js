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
      const pro = `_______________________________________________________________
|                                                             |
|  For small and medium businesses                            |
|                                                             |
|      | |     | |                                            |
|    __| | ___ | |_ ___ _ ____   ____  __  _ __  _ __ ___     |
|   / _\` |/ _ \\| __/ _ \\ '_ \\ \\ / /\\ \\/ / | '_ \\| '__/ _ \\    |
|  | (_| | (_) | ||  __/ | | \\ V /  >  <  | |_) | | | (_) |   |
|   \\__,_|\\___/ \\__\\___|_| |_|\\_/  /_/\\_\\ | .__/|_|  \\___/    |
|                                         | |                 |
|                                         |_|                 |
| ## learn more on dotenvx 🟨                                 |
|                                                             |
| >> https://dotenvx.com/pricing                              |
|                                                             |
| ## subscribe on github to be notified 📣                    |
|                                                             |
| >> https://github.com/dotenvx/dotenvx/issues/259            |
|                                                             |
| ----------------------------------------------------------- |
| - thank you for using dotenvx! - @motdotla                  |
|_____________________________________________________________|`

      console.log(pro)
      console.log('')
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-${command} to use [dotenvx ${command}] commands 🏆`)
      logger.help('? see installation instructions [https://github.com/dotenvx/dotenvx-pro]')
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeDynamic
