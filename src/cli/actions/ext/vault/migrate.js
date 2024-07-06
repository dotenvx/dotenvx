const { logger } = require('./../../../../shared/logger')

function migrate () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  logger.help2('To migrate your .env.vault file to encrypted .env file(s):')
  logger.help('')
  logger.help('  1. Run [dotenvx ext vault decrypt]')
  logger.help('  2. Run [ls -a .env*]')
  logger.help('')
  logger.help2('Lastly, encrypt each .env(.environment) file:')
  logger.help('')
  logger.help('  3. Run [dotenvx encrypt -f .env.production]')
  logger.help2('')
  logger.help2('For example:')
  logger.help2('')
  logger.help2('  $ dotenvx encrypt -f .env')
  logger.help2('  $ dotenvx encrypt -f .env.ci')
  logger.help2('  $ dotenvx encrypt -f .env.production')
  logger.help2('')
  logger.help2('Afterward:')
  logger.help2('')
  logger.help2('Update production with your new DOTENV_PRIVATE_KEY_PRODUCTION located in .env.keys')
  logger.help2('')
  logger.success('Learn more at [https://dotenvx.com/docs/quickstart#add-encryption]')
  logger.help2('')
}

module.exports = migrate
