const path = require('path')
const childProcess = require('child_process')
const { logger } = require('../../shared/logger')

function executeExtension (ext, command, rawArgs) {
  if (!command) {
    ext.outputHelp()
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

  const result = childProcess.spawnSync(`dotenvx-ext-${command}`, forwardedArgs, { stdio: 'inherit', env })
  if (result.error) {
    if (command === 'hub') {
      logger.warn(`[INSTALLATION_NEEDED] install dotenvx-ext-${command} to use [dotenvx ext ${command}] commands`)
      logger.help('? see installation instructions [https://github.com/dotenvx/dotenvx-ext-hub]')
    } else {
      logger.info(`error: unknown command '${command}'`)
    }
  }

  if (result.status !== 0) {
    process.exit(result.status)
  }
}

module.exports = executeExtension
