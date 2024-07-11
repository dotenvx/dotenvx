const fs = require('fs')
const { logger } = require('./../../shared/logger')

const main = require('./../../lib/main')

const isIgnoringDotenvKeys = require('../../lib/helpers/isIgnoringDotenvKeys')

const ENCODING = 'utf8'

function set (key, value) {
  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // encrypt
  let encrypt = true
  if (options.plain) {
    encrypt = false
  }

  try {
    const {
      processedEnvFiles,
      changedFilepaths,
      unchangedFilepaths
    } = main.set(key, value, options.envFile, encrypt)

    let withEncryption = ''

    if (encrypt) {
      withEncryption = ' with encryption'
    }

    for (const processedEnvFile of processedEnvFiles) {
      logger.verbose(`setting for ${processedEnvFile.envFilepath}`)

      if (processedEnvFile.error) {
        if (processedEnvFile.error.code === 'MISSING_ENV_FILE') {
          logger.warn(processedEnvFile.error.message)
          logger.help(`? add one with [echo "HELLO=World" > ${processedEnvFile.envFilepath}] and re-run [dotenvx set]`)
        } else {
          logger.warn(processedEnvFile.error.message)
        }
      } else {
        fs.writeFileSync(processedEnvFile.filepath, processedEnvFile.envSrc, ENCODING)

        logger.verbose(`${processedEnvFile.key} set${withEncryption} (${processedEnvFile.envFilepath})`)
        logger.debug(`${processedEnvFile.key} set${withEncryption} to ${processedEnvFile.value} (${processedEnvFile.envFilepath})`)
      }
    }

    if (changedFilepaths.length > 0) {
      logger.success(`✔ set ${key}${withEncryption} (${changedFilepaths.join(',')})`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`no changes (${unchangedFilepaths})`)
    } else {
      // do nothing
    }

    for (const processedEnvFile of processedEnvFiles) {
      if (processedEnvFile.privateKeyAdded) {
        logger.success(`✔ key added to .env.keys (${processedEnvFile.privateKeyName})`)

        if (!isIgnoringDotenvKeys()) {
          logger.help2('ℹ add .env.keys to .gitignore: [echo ".env.keys" >> .gitignore]')
        }

        logger.help2(`ℹ run [${processedEnvFile.privateKeyName}='${processedEnvFile.privateKey}' dotenvx get ${key}] to test decryption locally`)
      }
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

module.exports = set
