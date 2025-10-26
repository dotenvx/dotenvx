const { logger } = require('./../../../shared/logger')

const Lock = require('./../../../lib/services/lock')

const catchAndLog = require('../../../lib/helpers/catchAndLog')

function lock (passphrase) {
  logger.debug(`lock action called`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile
    const salt = options.salt

    const {
      processedEnvs,
    } = new Lock(envs, envKeysFilepath, passphrase, salt).run()

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
      } 
    }

    for (const processedEnv of processedEnvs) {
      if (processedEnv.privateKeyAdded) {
        logger.success(`✔ ${processedEnv.envKeysFilepath} (${processedEnv.privateKeyName}) locked`)


      }
    }
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = lock
