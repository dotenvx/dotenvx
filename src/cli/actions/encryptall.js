const logger = require('./../../shared/logger')

const main = require('./../../lib/main')

function encryptall () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      processedEnvFiles,
      settableFilepaths
    } = main.encryptall(options.envFile)

    let atLeastOneSuccess = false
    for (const processedEnvFile of processedEnvFiles) {
      logger.verbose(`encrypting ${processedEnvFile.filepath}`)
      if (processedEnvFile.error) {
        if (processedEnvFile.error.code === 'MISSING_ENV_FILE') {
          logger.warn(processedEnvFile.error)
          logger.help(`? add one with [echo "HELLO=World" > ${processedEnvFile.filepath}] and re-run [dotenvx encryptall]`)
        } else {
          logger.warn(processedEnvFile.error)
        }
      } else {
        atLeastOneSuccess = true
        // logger.verbose(`${processedEnvFile.key} set`)
        // logger.debug(`${processedEnvFile.key} set to ${processedEnvFile.value}`)
      }
    }

    if (atLeastOneSuccess) {
      logger.success(`encrypted (${settableFilepaths.join(', ')})`)
    }
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
  }
}

module.exports = encryptall
