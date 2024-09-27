const fs = require('fs')
const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')

const ENCODING = 'utf8'

function decrypt () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvFiles
    } = main.decrypt(options.envFile, options.key, options.excludeKey)

    for (const processedEnvFile of processedEnvFiles) {
      if (processedEnvFile.error) {
        errorCount += 1
        console.error(processedEnvFile.error.message)
      } else {
        console.log(processedEnvFile.envSrc)
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    } else {
      process.exit(0) // exit early
    }
  } else {
    try {
      const {
        processedEnvFiles,
        changedFilepaths,
        unchangedFilepaths
      } = main.decrypt(options.envFile, options.key, options.excludeKey)

      for (const processedEnvFile of processedEnvFiles) {
        logger.verbose(`decrypting ${processedEnvFile.envFilepath} (${processedEnvFile.filepath})`)

        if (processedEnvFile.error) {
          errorCount += 1

          if (processedEnvFile.error.code === 'MISSING_ENV_FILE') {
            logger.error(processedEnvFile.error.message)
            logger.help(`? add one with [echo "HELLO=World" > ${processedEnvFile.envFilepath}] and re-run [dotenvx decrypt]`)
          } else {
            logger.error(processedEnvFile.error.message)
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

      if (errorCount > 0) {
        process.exit(1)
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
