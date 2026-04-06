const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Rotate = require('./../../lib/services/rotate')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const localDisplayPath = require('../../lib/helpers/localDisplayPath')
const Session = require('../../db/session')

async function rotate () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'rotating', frames: ['⟳', '⤾', '⥁'] })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noOps = options.ops === false || (await sesh.noOps())

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = await new Rotate(envs, options.key, options.excludeKey, options.envKeysFile, noOps).run()
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
      if (processedEnv.localPrivateKeyAdded) {
        console.log('')
        console.log(processedEnv.envKeysSrc)
      }
    }
    process.exit(0) // exit early
  } else {
    try {
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await new Rotate(envs, options.key, options.excludeKey, options.envKeysFile, noOps).run()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`rotating ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          logger.warn(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
          if (processedEnv.localPrivateKeyAdded) {
            await fsx.writeFileX(processedEnv.envKeysFilepath, processedEnv.envKeysSrc)
          }

          logger.verbose(`rotated ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      if (changedFilepaths.length > 0) {
        const localKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.localPrivateKeyAdded)
        const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)

        let msg = `⟳ rotated (${changedFilepaths.join(',')})`
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

module.exports = rotate
