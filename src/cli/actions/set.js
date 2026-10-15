const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const setTransform = require('./../../lib/transforms/set')
const logSetSummary = require('../../lib/helpers/logSetSummary')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Errors = require('../../lib/helpers/errors')
const prompts = require('../../lib/helpers/prompts')

async function set (key, value) {
  const options = this.opts()
  const spinnerOptions = typeof this.optsWithGlobals === 'function' ? this.optsWithGlobals() : options

  let encrypt = true
  let settingMessage = 'encrypting'
  let settingSymbol = '◈'
  if (options.plain) {
    encrypt = false
    settingMessage = 'setting'
    settingSymbol = '◇'
  }

  if (value === undefined || value === null) {
    if (!process.stdin.isTTY) {
      catchAndLog(new Errors({ key }).missingValue())
      return { exitCode: 1 }
    }

    try {
      value = await prompts.password({
        message: key,
        prefix: settingSymbol,
        separator: '='
      }, {
        input: process.stdin,
        output: process.stderr
      })
    } catch (error) {
      if (error.code === 'PROMPT_CANCELLED') {
        return { exitCode: 130, error }
      }

      throw error
    }
  }

  const spinner = await createSpinner({ ...spinnerOptions, ...options, text: settingMessage })

  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)
  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs || []
  const fk = options.envKeysFile || '.env.keys'
  const noCreate = options.create === false
  const noArmor = options.armor === false
  const noNative = options.native === false || options.noNative === true

  const noBitwarden = options.bitwarden === false || options.noBitwarden === true
  const no1Password = options['1password'] === false || options.no1Password === true

  let errorCount = 0

  try {
    const { keysSrc, processedEnvs, changedFilepaths, unchangedFilepaths } = await setTransform({ profile: options.profile, envs, key, value, fk, noArmor, token: options.token, noCreate, encrypt, noNative, no1Password, noBitwarden })

    if (keysSrc) {
      await fsx.writeKeyFile(fk, keysSrc)
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

    await logSetSummary(key, encrypt, { processedEnvs, changedFilepaths, unchangedFilepaths })

    return { exitCode: errorCount > 0 ? 1 : 0, errorCount }
  } catch (error) {
    if (spinner) spinner.stop()
    catchAndLog(error)
    return { exitCode: 1, error }
  }
}

module.exports = require('../../lib/events/cli')('set', set)
