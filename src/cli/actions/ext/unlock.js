const { logger } = require('../../../shared/logger')

const Unlock = require('../../../lib/services/unlock')

const catchAndLog = require('../../../lib/helpers/catchAndLog')

function unlock (passphrase) {
  logger.debug('unlock action called')

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile
    const salt = options.salt

    logger.debug(`about to call new Unlock(...).run() with envs: ${JSON.stringify(envs)}, envKeysFilepath: ${envKeysFilepath}, passphrase: ${passphrase}, salt: ${salt}`)

    const {
      processedEnvs
    } = new Unlock(envs, envKeysFilepath, passphrase, salt).run()

    logger.debug(`Unlock.run() completed returning processedEnvs: ${JSON.stringify(processedEnvs)}`)

    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        logger.verbose(`processedEnv got error: ${JSON.stringify(processedEnv.error)}`)

        if (processedEnv.error.code === 'MISSING_ENV_FILE') {
          logger.warn(processedEnv.error.message)
          logger.help(`? add one with [echo "HELLO=World" > ${processedEnv.envFilepath}] and re-run [dotenvx set]`)
        } else {
          logger.warn(processedEnv.error.message)
          if (processedEnv.error.help) {
            logger.help(processedEnv.error.help)
          }
        }
      }
    }

    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        logger.error(processedEnv.error.message)
        if (processedEnv.error.help) {
          logger.help(processedEnv.error.help)
        }
      }
      if (processedEnv.unlocked) {
        logger.success(`✔ ${processedEnv.envKeysFilepath} (${processedEnv.privateKeyName}) unlocked`)
      }
    }
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = unlock
