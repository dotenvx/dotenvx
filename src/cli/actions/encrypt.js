const fs = require('fs')

const main = require('./../../lib/main')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const createSpinner = require('./../../shared/createSpinner')
const { AppendToIgnores } = require('./../ignores')

const spinner = createSpinner('encrypting')

// constants
const ENCODING = 'utf8'

async function encrypt () {
  new AppendToIgnores().run()

  spinner.start()
  await helpers.sleep(500) // better dx

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  let optionEnvFile = options.envFile
  if (!Array.isArray(optionEnvFile)) {
    optionEnvFile = [optionEnvFile]
  }

  const addedKeys = new Set()
  const addedVaults = new Set()
  const addedEnvFilepaths = new Set()

  // must be at least one .env* file
  if (optionEnvFile.length < 1) {
    spinner.fail('no .env* files found')
    logger.help('? add one with [echo "HELLO=World" > .env] and then run [dotenvx encrypt]')
    process.exit(1)
  }

  try {
    logger.verbose(`generating .env.keys from ${optionEnvFile}`)

    const dotenvKeys = (main.configDotenv({ path: '.env.keys' }).parsed || {})

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)
      if (!fs.existsSync(filepath)) {
        spinner.fail(`file does not exist at [${filepath}]`)
        logger.help(`? add it with [echo "HELLO=World" > ${envFilepath}] and then run [dotenvx encrypt]`)
        process.exit(1)
      }

      const environment = helpers.guessEnvironment(filepath)
      const key = `DOTENV_KEY_${environment.toUpperCase()}`

      let value = dotenvKeys[key]

      // first time seeing new DOTENV_KEY_${environment}
      if (!value || value.length === 0) {
        logger.verbose(`generating ${key}`)
        value = helpers.generateDotenvKey(environment)
        logger.debug(`generating ${key} as ${value}`)

        dotenvKeys[key] = value

        addedKeys.add(key) // for info logging to user
      } else {
        logger.verbose(`existing ${key}`)
        logger.debug(`existing ${key} as ${value}`)
      }
    }

    let keysData = `#/!!!!!!!!!!!!!!!!!!!.env.keys!!!!!!!!!!!!!!!!!!!!!!/
#/   DOTENV_KEYs. DO NOT commit to source control   /
#/   [how it works](https://dotenv.org/env-keys)    /
#/--------------------------------------------------/\n`

    for (const key in dotenvKeys) {
      const value = dotenvKeys[key]
      keysData += `${key}="${value}"\n`
    }

    fs.writeFileSync('.env.keys', keysData)
  } catch (error) {
    spinner.fail(error.message)
    process.exit(1)
  }

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
#/   [how it works](https://dotenv.org/env-vault)   /
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

  if (addedKeys.size > 0) {
    spinner.succeed(`${helpers.pluralize('key', addedKeys.size)} added to .env.keys (${[...addedKeys]})`)
    logger.help2('ℹ push .env.keys up to hub: [dotenvx hub push]')
  }

  if (addedVaults.size > 0) {
    const DOTENV_VAULT_X = [...addedVaults][addedVaults.size - 1]
    const DOTENV_KEY_X = DOTENV_VAULT_X.replace('_VAULT_', '_KEY_')
    const tryKey = dotenvKeys[DOTENV_KEY_X] || '<dotenv_key_environment>'

    logger.help2(`ℹ run [DOTENV_KEY='${tryKey}' dotenvx run -- yourcommand] to test decryption locally`)
  }

  // logger.verbose('')
  // logger.verbose('next:')
  // logger.verbose('')
  // logger.verbose('    1. commit .env.vault safely to code')
  // logger.verbose('    2. set DOTENV_KEY on server (or ci)')
  // logger.verbose('    3. push your code')
  // logger.verbose('')
  // logger.verbose('protips:')
  // logger.verbose('')
  // logger.verbose('    * .env.keys file holds your decryption DOTENV_KEYs')
  // logger.verbose('    * DO NOT commit .env.keys to code')
  // logger.verbose('    * share .env.keys file over secure channels only')
}

module.exports = encrypt
