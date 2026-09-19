const initEnvfile = require('../../lib/services/init')
const { logger } = require('../../shared/logger')
const catchAndLog = require('../../lib/helpers/catchAndLog')

module.exports = function define () {
  try {
    const { created } = initEnvfile({ envFile: this.opts().envFile })
    if (created) {
      logger.success('≡ defined (Envfile)')
    } else {
      logger.info('○ Envfile already exists (unchanged)')
    }
  } catch (error) {
    catchAndLog(error)
    process.exitCode = 1
  }
}
