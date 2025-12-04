const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Sets = require('./../../lib/services/sets')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const isIgnoringDotenvKeys = require('../../lib/helpers/isIgnoringDotenvKeys')
const gpgAvailable = require('../../lib/helpers/gpgAvailable')

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

  // GPG options
  const gpgOptions = {
    gpg: options.gpg,
    gpgKey: options.gpgKey
  }

  // Check GPG availability if using GPG encryption
  if (options.gpg && encrypt) {
    const gpg = gpgAvailable()
    if (!gpg.available) {
      logger.error(gpg.error)
      process.exit(1)
    }
    logger.verbose(`Using GPG ${gpg.version} (${gpg.bin})`)
  }

  try {
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = new Sets(key, value, envs, encrypt, envKeysFilepath, gpgOptions).run()

    let withEncryption = ''

    if (encrypt) {
      if (options.gpg) {
        withEncryption = ' with GPG encryption'
      } else {
        withEncryption = ' with encryption'
      }
    }

    for (const processedEnv of processedEnvs) {
      logger.verbose(`setting for ${processedEnv.envFilepath}`)

      if (processedEnv.error) {
        if (processedEnv.error.code === 'MISSING_ENV_FILE') {
          logger.warn(processedEnv.error.message)
          logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.envFilepath}] and re-run [dotenvx set]`)
        } else {
          logger.warn(processedEnv.error.message)
          if (processedEnv.error.help) {
            logger.help(processedEnv.error.help)
          }
        }
      } else {
        fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

        logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
        logger.debug(`${processedEnv.key} set${withEncryption} to ${processedEnv.value} (${processedEnv.envFilepath})`)
      }
    }

    if (changedFilepaths.length > 0) {
      logger.success(`✔ set ${key}${withEncryption} (${changedFilepaths.join(',')})`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`no changes (${unchangedFilepaths})`)
    } else {
      // do nothing
    }

    for (const processedEnv of processedEnvs) {
      if (processedEnv.privateKeyAdded) {
        logger.success(`✔ key added to ${processedEnv.envKeysFilepath} (${processedEnv.privateKeyName})`)

        if (!isIgnoringDotenvKeys()) {
          logger.help('⮕  next run [dotenvx ext gitignore --pattern .env.keys] to gitignore .env.keys')
        }

        logger.help(`⮕  next run [${processedEnv.privateKeyName}='${processedEnv.privateKey}' dotenvx get ${key}] to test decryption locally`)
      }

      // GPG-specific success message
      if (processedEnv.cryptoProvider === 'gpg' && processedEnv.changed) {
        logger.help(`⮕  GPG recipient: ${processedEnv.gpgRecipient}`)
        logger.help('⮕  Decryption will require the corresponding GPG private key (YubiKey PIN may be prompted)')
      }
    }
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = set
