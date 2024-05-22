const { logger } = require('./../../../shared/logger')

function convert (directory) {
  // debug args
  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    logger.help2('To convert your .env.vault file to encrypted .env file(s):')
    logger.help('')
    logger.help('  1. Run [dotenvx vault decrypt]')
    logger.help('  2. Run [ls -a .env*]')
    logger.help('')
    logger.help2('Lastly, convert each .env(.environment) file:')
    logger.help('')
    logger.help('  3. Run [dotenvx convert -f .env.production]')
    logger.help2('')
    logger.help2('For example:')
    logger.help2('')
    logger.help2('  $ dotenvx convert -f .env')
    logger.help2('  $ dotenvx convert -f .env.ci')
    logger.help2('  $ dotenvx convert -f .env.production')
    logger.help2('')
    logger.help2('Afterward:')
    logger.help2('')
    logger.help2('Update production with your new DOTENV_PRIVATE_KEY_PRODUCTION located in .env.keys')
    logger.help2('')
    logger.success('Learn more at [https://dotenvx.com/docs/quickstart#add-encryption]')
    logger.help2('')
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    if (error.debug) {
      logger.debug(error.debug)
    }
    if (error.code) {
      logger.debug(`ERROR_CODE: ${error.code}`)
    }
    process.exit(1)
  }
}

module.exports = convert
