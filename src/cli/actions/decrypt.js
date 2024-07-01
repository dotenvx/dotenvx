const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')

const ENCODING = 'utf8'

async function decrypt () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const {
    processedEnvFiles,
  } = main.decrypt(options.envFile, options.key)

  // stdout
  if (options.output && options.output === true) {
    for (const processedEnvFile of processedEnvFiles) {
      logger.blank(processedEnvFile.envSrc)
      logger.blank('')
    }
  // write to file
  } else if (options.output) {
    // TODO - -o filename.txt

  } else {
    // TODO - rewrite same file
  }

  try {

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

module.exports = decrypt
