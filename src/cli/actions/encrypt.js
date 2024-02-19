const fs = require('fs')

const main = require('./../../lib/main')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const createSpinner = require('./../../shared/createSpinner')

const spinner = createSpinner('encrypting')

// constants
const ENCODING = 'utf8'

async function encrypt (directory) {
  spinner.start()
  await helpers.sleep(500) // better dx

  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let optionEnvFile = options.envFile || helpers.findEnvFiles(directory)

  let finalAddedKeys = []

  try {
    const { envKeys, addedKeys, existingKeys } = main.encrypt(directory, optionEnvFile)

    finalAddedKeys = addedKeys

    logger.verbose(`generating .env.keys from ${optionEnvFile}`)

    if (addedKeys.length > 0) {
      logger.verbose(`generated ${addedKeys}`)
    }
    if (existingKeys.length > 0) {
      logger.verbose(`existing ${existingKeys}`)
    }

    fs.writeFileSync('.env.keys', envKeys)
  } catch (error) {
    spinner.fail(error.message)
    if (error.help) {
      logger.help(error.help)
    }
    if (error.code) {
      logger.debug(`ERROR_CODE: ${error.code}`)
    }
    process.exit(1)
  }

  if (!Array.isArray(optionEnvFile)) {
    optionEnvFile = [optionEnvFile]
  }

  const addedVaults = new Set()
  const addedEnvFilepaths = new Set()

  // used later in logging to user
  const dotenvKeys = (main.configDotenv({ path: '.env.keys' }).parsed || {})

  try {
    logger.verbose(`generating .env.vault from ${optionEnvFile}`)

    const dotenvVaults = (main.configDotenv({ path: '.env.vault' }).parsed || {})

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)
      const environment = helpers.guessEnvironment(filepath)
      const vault = `DOTENV_VAULT_${environment.toUpperCase()}`

      let ciphertext = dotenvVaults[vault]
      const dotenvKey = dotenvKeys[`DOTENV_KEY_${environment.toUpperCase()}`]

      if (!ciphertext || ciphertext.length === 0 || helpers.changed(ciphertext, dotenvKey, filepath, ENCODING)) {
        logger.verbose(`encrypting ${vault}`)
        ciphertext = helpers.encryptFile(filepath, dotenvKey, ENCODING)
        logger.verbose(`encrypting ${vault} as ${ciphertext}`)

        dotenvVaults[vault] = ciphertext

        addedVaults.add(vault) // for info logging to user
        addedEnvFilepaths.add(envFilepath) // for info logging to user
      } else {
        logger.verbose(`existing ${vault}`)
        logger.debug(`existing ${vault} as ${ciphertext}`)
      }
    }

    let vaultData = `#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenvx.com/env-vault)  /
#/--------------------------------------------------/\n\n`

    for (const vault in dotenvVaults) {
      const value = dotenvVaults[vault]
      const environment = vault.replace('DOTENV_VAULT_', '').toLowerCase()
      vaultData += `# ${environment}\n`
      vaultData += `${vault}="${value}"\n\n`
    }

    fs.writeFileSync('.env.vault', vaultData)
  } catch (e) {
    spinner.fail(e.message)
    process.exit(1)
  }

  if (addedEnvFilepaths.size > 0) {
    spinner.succeed(`encrypted to .env.vault (${[...addedEnvFilepaths]})`)
    logger.help2('ℹ commit .env.vault to code: [git commit -am ".env.vault"]')
  } else {
    spinner.done(`no changes (${optionEnvFile})`)
  }

  if (finalAddedKeys.length > 0) {
    spinner.succeed(`${helpers.pluralize('key', finalAddedKeys.length)} added to .env.keys (${finalAddedKeys})`)
    logger.help2('ℹ push .env.keys up to hub: [dotenvx hub push]')
  }

  if (addedVaults.size > 0) {
    const DOTENV_VAULT_X = [...addedVaults][addedVaults.size - 1]
    const DOTENV_KEY_X = DOTENV_VAULT_X.replace('_VAULT_', '_KEY_')
    const tryKey = dotenvKeys[DOTENV_KEY_X] || '<dotenv_key_environment>'

    logger.help2(`ℹ run [DOTENV_KEY='${tryKey}' dotenvx run -- yourcommand] to test decryption locally`)
  }
}

module.exports = encrypt
