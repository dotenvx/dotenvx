const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Sets = require('./../../lib/services/sets')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const localDisplayPath = require('../../lib/helpers/localDisplayPath')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')

async function set (key, value) {
  const options = this.opts()
  const spinner = await createSpinner(options)

  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)
  logger.debug(`options: ${JSON.stringify(options)}`)

  let encrypt = true
  if (options.plain) {
    encrypt = false
  }

  try {
    const sesh = new Session()
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile
    const noOps = options.ops === false || !(await sesh.opsOn())
    const opsOn = !noOps
    const noCreate = options.create === false

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = await new Sets(key, value, envs, encrypt, envKeysFilepath, opsOn, noCreate).run()

    let withEncryption = ''

    if (encrypt) {
      withEncryption = ' with encryption'
    }

    for (const processedEnv of processedEnvs) {
      logger.verbose(`setting for ${processedEnv.envFilepath}`)

      if (processedEnv.error) {
        logger.warn(processedEnv.error.messageWithHelp)
      } else {
        fsx.writeFileXSync(processedEnv.filepath, processedEnv.envSrc)

        logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
        logger.debug(`${processedEnv.key} set${withEncryption} to ${processedEnv.value} (${processedEnv.envFilepath})`)
      }
    }

    const keyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.privateKeyAdded)
    const keyAddedSuffix = keyAddedEnv ? ` + key (${localDisplayPath(keyAddedEnv.envKeysFilepath)})` : ''

    if (changedFilepaths.length > 0) {
      if (encrypt) {
        logger.success(`◈ encrypted ${key} (${changedFilepaths.join(',')})${keyAddedSuffix}`)
      } else {
        logger.success(`◇ set ${key} (${changedFilepaths.join(',')})`)
      }
    } else if (encrypt && keyAddedEnv) {
      const keyAddedEnvFilepath = keyAddedEnv.envFilepath || changedFilepaths[0] || '.env'
      logger.success(`◈ encrypted ${key} (${keyAddedEnvFilepath})${keyAddedSuffix}`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`○ no change (${unchangedFilepaths})`)
    } else {
      // do nothing
    }

    // intentionally quiet: success line communicates key creation
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = set
