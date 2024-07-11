const fs = require('fs')
const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')

const ENCODING = 'utf8'

function decrypt () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvFiles
    } = main.decrypt(options.envFile, options.key)

    for (const processedEnvFile of processedEnvFiles) {
      process.stdout.write(processedEnvFile.envSrc)
    }
    process.exit(0) // exit early
  } else {
    try {
      const {
        processedEnvFiles,
        changedFilepaths,
        unchangedFilepaths
      } = main.decrypt(options.envFile, options.key)

      for (const processedEnvFile of processedEnvFiles) {
        logger.verbose(`decrypting ${processedEnvFile.envFilepath} (${processedEnvFile.filepath})`)
        if (processedEnvFile.error) {
          if (processedEnvFile.error.code === 'MISSING_ENV_FILE') {
            logger.warn(processedEnvFile.error.message)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnvFile.envFilepath}] and re-run [dotenvx decrypt]`)
          } else {
            logger.warn(processedEnvFile.error.message)
          }
        } else if (processedEnvFile.changed) {
          fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)

          logger.verbose(`decrypted ${processedEnvFile.envFilepath} (${processedEnvFile.filepath})`)
        } else {
          logger.verbose(`no changes ${processedEnvFile.envFilepath} (${processedEnvFile.filepath})`)
        }
      }

      if (changedFilepaths.length > 0) {
        logger.success(`✔ decrypted (${changedFilepaths.join(',')})`)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`no changes (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }
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
}

module.exports = decrypt
