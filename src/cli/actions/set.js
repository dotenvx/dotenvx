const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const setTransform = require('./../../lib/transforms/set')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')

async function set (key, value) {
  const options = normalizeArmorAliases(this.opts())

  let encrypt = true
  let settingMessage = 'encrypting'
  if (options.plain) {
    encrypt = false
    settingMessage = 'setting'
  }

  const spinner = await createSpinner({ ...options, text: settingMessage })
  const sesh = new Session()

  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []
  const fk = options.envKeysFile || '.env.keys'
  const noCreate = options.create === false
  const noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))

  let errorCount = 0

  try {
    const { keysSrc, processedEnvs, changedFilepaths, unchangedFilepaths } = await setTransform({ envs, key, value, fk, noArmor, noCreate, encrypt })

    if (keysSrc) {
      await fsx.writeFileX(fk, keysSrc)
    }

    let withEncryption = ''
    if (encrypt) {
      withEncryption = ' with encryption'
    }

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      logger.verbose(`setting for ${processedEnv.envFilepath}`)
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      } else if (processedEnv.changed) {
        await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)
        logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
      } else {
        logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
      }
    }

    //const localKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.localPrivateKeyAdded)
    //const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)
    // let keyAddedSuffix = ''
    // if (remoteKeyAddedEnv) {
    //   keyAddedSuffix = ' · armored ⛨'
    // }

    if (changedFilepaths.length > 0) {
      let msg = `◇ set ${key} (${changedFilepaths.join(',')})`
      if (encrypt) {
        msg = `◈ encrypted ${key} (${changedFilepaths.join(',')})`
      }

      logger.success(msg)

      // if (encrypt) {
      //   logger.success(`◈ encrypted ${key} (${changedFilepaths.join(',')})${keyAddedSuffix}`)
      // } else {
      //   logger.success(`◇ set ${key} (${changedFilepaths.join(',')})`)
      // }
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`○ no change (${unchangedFilepaths})`)
    } else {
      // do nothing - scenario when no .env files found
    }

    // } else if (encrypt && localKeyAddedEnv) {
    //   const localKeyAddedEnvFilepath = localKeyAddedEnv.envFilepath || changedFilepaths[0] || '.env'
    //   logger.success(`◈ encrypted ${key} (${localKeyAddedEnvFilepath})${keyAddedSuffix}`)
    // } else if (unchangedFilepaths.length > 0) {
    //   logger.info(`○ no change (${unchangedFilepaths})`)
    // } else {
    //   // do nothing
    // }

    if (errorCount > 0) {
      process.exit(1)
    }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = set
