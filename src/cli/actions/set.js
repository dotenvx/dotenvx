const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')
const { promptForMissingVars } = require('../../shared/prompt-user')

const Sets = require('./../../lib/services/sets')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const isIgnoringDotenvKeys = require('../../lib/helpers/isIgnoringDotenvKeys')

async function promptForKeyValue(key, value) {
  const missingVars = []
  
  if (key === undefined) {
    missingVars.push({
      name: 'key',
        type: 'input',
        message: 'Enter the environment variable KEY:',
        validate: (input) => {
          if (!input || input.trim() === '') {
            return 'KEY cannot be empty'
          }
          if (!/^[A-Z_][A-Z0-9_]*$/i.test(input.trim())) {
            return 'KEY must contain only letters, numbers, and underscores, and cannot start with a number'
          }
          return true
        }
    })
  }
  
  if (value === undefined) {
    missingVars.push({
      name: 'value',
      type: "input",
      message: "Enter the environment variable value:",
      validate: (input) => {
        if (!input || input.trim() === '') {
          return 'VALUE cannot be empty'
        }
        return true
      }
    })
  }
  
  const answers = await promptForMissingVars(missingVars, {
    helpMessage: 'Please provide KEY and value as arguments: dotenvx set <KEY> <value>'
  })
  
  return {
    key: key !== undefined ? key : answers.key,
    value: value !== undefined ? value : answers.value
  }
}

async function set (key, value) {
  logger.debug(`key: ${key}`)
  logger.debug(`value: ${value}`)

  if (key === undefined || value === undefined) {
    const result = await promptForKeyValue(key, value)
    key = result.key
    value = result.value
  }

  logger.debug(`final key: ${key}`)
  logger.debug(`final value: ${value}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // encrypt
  let encrypt = true
  if (options.plain) {
    encrypt = false
  }

  try {
    const envs = this.envs
    const envKeysFilepath = options.envKeysFile

    const {
      processedEnvs,
      changedFilepaths,
      unchangedFilepaths
    } = new Sets(key, value, envs, encrypt, envKeysFilepath).run()

    let withEncryption = ''

    if (encrypt) {
      withEncryption = ' with encryption'
    }

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
      } else {
        fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

        logger.verbose(`${processedEnv.key} set${withEncryption} (${processedEnv.envFilepath})`)
        logger.debug(`${processedEnv.key} set${withEncryption} to ${processedEnv.value} (${processedEnv.envFilepath})`)
      }
    }

    if (changedFilepaths.length > 0) {
      logger.success(`✔ set ${key}${withEncryption} (${changedFilepaths.join(',')})`)
    } else if (unchangedFilepaths.length > 0) {
      logger.info(`no changes (${unchangedFilepaths})`)
    } else {
      // do nothing
    }

    for (const processedEnv of processedEnvs) {
      if (processedEnv.privateKeyAdded) {
        logger.success(`✔ key added to ${processedEnv.envKeysFilepath} (${processedEnv.privateKeyName})`)

        if (!isIgnoringDotenvKeys()) {
          logger.help('⮕  next run [dotenvx ext gitignore --pattern .env.keys] to gitignore .env.keys')
        }

        logger.help(`⮕  next run [${processedEnv.privateKeyName}='${processedEnv.privateKey}' dotenvx get ${key}] to test decryption locally`)
      }
    }
  } catch (error) {
    catchAndLog(error)
    process.exit(1)
  }
}

module.exports = set
