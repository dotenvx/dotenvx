const { logger } = require('./../../../shared/logger')

const Precommit = require('./../../../lib/services/precommit')
const catchAndLog = require('./../../../lib/helpers/catchAndLog')

function precommit (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    if (options.uninstall) {
      if (options.install) throw new Error('--install and --uninstall cannot be used together')
      const { removed, warning } = require('../../../lib/helpers/uninstallPrecommitHook')(directory)
      if (warning) logger.warn(warning)
      else logger.success(removed ? '▣ uninstalled (dotenvx precommit hook)' : '○ no dotenvx precommit hook found')
      return
    }
    logger.warn('[DEPRECATED] dotenvx precommit. fix: run [dotenvx protect]')
    const {
      successMessage,
      warnings
    } = new Precommit(directory, options).run()

    for (const warning of warnings) {
      logger.warn(warning.messageWithHelp || warning.message)
    }

    logger.success(successMessage)
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = precommit
