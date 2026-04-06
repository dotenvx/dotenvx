const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Encrypt = require('./../../lib/services/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const localDisplayPath = require('../../lib/helpers/localDisplayPath')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')

async function encrypt () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'encrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  const envs = this.envs
  const noOps = options.ops === false || (await sesh.noOps())
  const noCreate = options.create === false

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = await new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noOps, noCreate).run()
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
    }
    process.exit(0) // exit early
  } else {
    try {
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noOps, noCreate).run()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          logger.warn(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      if (changedFilepaths.length > 0) {
        const localKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.localPrivateKeyAdded)
        const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)
        let msg = `◈ encrypted (${changedFilepaths.join(',')})`
        if (localKeyAddedEnv) {
          const envKeysFilepath = localDisplayPath(localKeyAddedEnv.envKeysFilepath)
          msg += ` + key (${envKeysFilepath})`
        }
        if (remoteKeyAddedEnv) {
          msg += ' + key ⛨'
        }
        logger.success(msg)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no change (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }
    } catch (error) {
      if (spinner) spinner.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = encrypt
