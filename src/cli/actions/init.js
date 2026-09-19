const initEnvfile = require('../../lib/services/init')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function init () {
  try {
    const { created, source, count } = initEnvfile({ envFile: this.opts().envFile })
    if (created) {
      logger.success(source
        ? `▣ created Envfile from ${source} (${count} variable${count === 1 ? '' : 's'})`
        : '▣ created starter Envfile')
    } else {
      logger.info('○ Envfile already exists (unchanged)')
    }
    logger.info('Review Envfile, then run: dotenvx validate')
    logger.info('dotenvx run automatically validates when Envfile is present.')
  } catch (error) {
    catchAndLog(error)
    process.exitCode = 1
  }
}
