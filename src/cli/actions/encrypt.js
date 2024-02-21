const fs = require('fs')
const path = require('path')

const main = require('./../../lib/main')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const createSpinner = require('./../../shared/createSpinner')
const spinner = createSpinner('encrypting')

async function encrypt (directory) {
  spinner.start()
  await helpers.sleep(500) // better dx

  logger.debug(`directory: ${directory}`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      dotenvKeys,
      dotenvKeysFile,
      addedKeys,
      existingKeys,
      dotenvVaultFile,
      addedVaults,
      existingVaults,
      addedDotenvFilenames,
      envFile
    } = main.encrypt(directory, options.envFile)

    logger.verbose(`generating .env.keys from ${envFile}`)
    if (addedKeys.length > 0) {
      logger.verbose(`generated ${addedKeys}`)
    }
    if (existingKeys.length > 0) {
      logger.verbose(`existing ${existingKeys}`)
    }
    fs.writeFileSync(path.resolve(directory, '.env.keys'), dotenvKeysFile)

    logger.verbose(`generating .env.vault from ${envFile}`)
    if (addedVaults.length > 0) {
      logger.verbose(`encrypting ${addedVaults}`)
    }
    if (existingVaults.length > 0) {
      logger.verbose(`existing ${existingVaults}`)
    }
    fs.writeFileSync(path.resolve(directory, '.env.vault'), dotenvVaultFile)

    if (addedDotenvFilenames.length > 0) {
      spinner.succeed(`encrypted to .env.vault (${addedDotenvFilenames})`)
      logger.help2('ℹ commit .env.vault to code: [git commit -am ".env.vault"]')
    } else {
      spinner.done(`no changes (${envFile})`)
    }

    if (addedKeys.length > 0) {
      spinner.succeed(`${helpers.pluralize('key', addedKeys.length)} added to .env.keys (${addedKeys})`)
      logger.help2('ℹ push .env.keys up to hub: [dotenvx hub push]')
    }

    if (addedVaults.length > 0) {
      const DOTENV_VAULT_X = addedVaults[addedVaults.length - 1]
      const DOTENV_KEY_X = DOTENV_VAULT_X.replace('_VAULT_', '_KEY_')
      const tryKey = dotenvKeys[DOTENV_KEY_X]

      logger.help2(`ℹ run [DOTENV_KEY='${tryKey}' dotenvx run -- yourcommand] to test decryption locally`)
    }
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
}

module.exports = encrypt
