const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Encrypt = require('./../../lib/services/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const localDisplayPath = require('../../lib/helpers/localDisplayPath')
const createPrefixLoader = require('../../lib/helpers/createPrefixLoader')
const sleep = require('../../lib/helpers/sleep')

async function encrypt () {
  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const opsOn = options.opsOff !== true
  const noCreate = options.create === false

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, opsOn, noCreate).run()

    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
    }
    process.exit(0) // exit early
  } else {
    const loader = createPrefixLoader('encrypting', { ...options })
    loader.start()

    try {
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, opsOn, noCreate).run()

      loader.stop()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          logger.warn(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
          fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no changes ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (changedFilepaths.length > 0) {
        const keyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.privateKeyAdded)
        let msg = `◈ encrypted (${changedFilepaths.join(',')})`
        if (keyAddedEnv) {
          const envKeysFilepath = localDisplayPath(keyAddedEnv.envKeysFilepath)
          msg += ` + key (${envKeysFilepath})`
        }
        logger.success(msg)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no changes (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }

      for (const processedEnv of processedEnvs) {
        if (processedEnv.privateKeyAdded) {
          // intentionally quiet: success line already communicates key creation
        }
      }
    } catch (error) {
      loader.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = encrypt
