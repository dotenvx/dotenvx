const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Encrypt = require('./../../lib/services/encrypt')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const prompts = require('../../lib/helpers/prompts')
const Session = require('../../db/session')
const normalizeArmorOptions = require('./normalizeArmorOptions')

function keyStorageSelector () {
  let selected

  return async function selectKeyStorage () {
    if (selected) return selected

    selected = await prompts.select({
      message: 'Choose private key storage',
      choices: [
        { name: '◫ File (.env.keys)', value: 'file' },
        { name: '⛨ Armor (armor.dotenvx.com)', value: 'armored' }
      ]
    }, {
      input: process.stdin,
      output: process.stderr
    })

    return selected
  }
}

function encryptOptions (noArmor) {
  const options = {}

  if (!noArmor) {
    options.selectKeyStorage = keyStorageSelector()
  }

  return options
}

async function encrypt () {
  const options = normalizeArmorOptions(this.opts())
  const spinner = await createSpinner({ ...options, text: 'encrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noArmor = options.armor === false || (!options.token && (await sesh.noArmor()))
  const noCreate = options.create === false

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    if (spinner) spinner.stop()
    const {
      processedEnvs
    } = await new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, noCreate, options.token, {
      ...encryptOptions(noArmor),
      command: process.argv.slice(2)
    }).run()
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      console.log(processedEnv.envSrc)
    }
    process.exit(0) // exit early
  } else {
    try {
      if (spinner) spinner.stop()
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await new Encrypt(envs, options.key, options.excludeKey, options.envKeysFile, noArmor, noCreate, options.token, {
        ...encryptOptions(noArmor),
        command: process.argv.slice(2)
      }).run()

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
        const remoteKeyAddedEnv = processedEnvs.find((processedEnv) => processedEnv.remotePrivateKeyAdded)
        let msg = `◈ encrypted (${changedFilepaths.join(',')})`
        if (remoteKeyAddedEnv) {
          msg += ' · armored ⛨'
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
