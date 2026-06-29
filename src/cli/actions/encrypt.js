const fsx = require('./../../lib/helpers/fsx')
const path = require('path')
const { logger } = require('./../../shared/logger')

const encryptTransform = require('./../../lib/transforms/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')

async function encryptAction () {
  const options = normalizeArmorAliases(this.opts())
  const spinner = await createSpinner({ ...options, text: 'encrypting' })
  const sesh = new Session()

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []
  const ik = options.key
  const ek = options.excludeKey
  const fk = options.envKeysFile || '.env.keys'
  const noCreate = options.create === false
  let noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      keysSrc,
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await encryptTransform({ envs, ik, ek, fk, noArmor, noCreate })

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      }
      if (processedEnv.envSrc) {
        console.log(processedEnv.envSrc)
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    } else {
      process.exit(0) // exit early
    }
  } else {
    try {
      // const {
      //   keysSrc,
      //   processedEnvs,
      //   changedFilepaths,
      //   unchangedFilepaths
      // } = await encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, noCreate, options.token, {
      //   ...encryptOptions(noArmor),
      //   command: process.argv.slice(2)
      // })
      const {
        keysSrc,
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await encryptTransform({ envs, ik, ek, fk, noArmor, noCreate })

      if (keysSrc) {
        await fsx.writeFileX(fk, keysSrc)
      }

      if (spinner) spinner.stop()
      for (const processedEnv of processedEnvs) {
        logger.verbose(`encrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
        } else if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
          logger.verbose(`encrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (changedFilepaths.length > 0) {
        // const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)
        let msg = `◈ encrypted (${changedFilepaths.join(',')})`
        // if (remoteKeyAddedEnv) {
        //   msg += ' · armored ⛨'
        // }
        logger.success(msg)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no change (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }

      if (errorCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      if (spinner) spinner.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = encryptAction
