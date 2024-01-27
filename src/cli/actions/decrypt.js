const fs = require('fs')

const main = require('./../../lib/main')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const createSpinner = require('./../../shared/createSpinner')

const spinner = createSpinner('decrypting')

// constants
const ENCODING = 'utf8'

async function decrypt () {
  spinner.start()
  await helpers.sleep(500) // better dx

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  const vaultFilepath = helpers.resolvePath('.env.vault')
  const keysFilepath = helpers.resolvePath('.env.keys')
  const changedEnvFilenames = new Set()
  const unchangedEnvFilenames = new Set()

  // logger.verbose(`checking for .env.vault`)
  if (!fs.existsSync(vaultFilepath)) {
    spinner.fail(`.env.vault file missing: ${vaultFilepath}`)
    logger.help('? generate one with [dotenvx encrypt]')
    process.exit(1)
  }

  // logger.verbose(`checking for .env.keys`)
  if (!fs.existsSync(keysFilepath)) {
    spinner.fail(`.env.keys file missing: ${keysFilepath}`)
    logger.help('? a .env.keys file must be present in order to decrypt your .env.vault contents to .env file(s)')
    process.exit(1)
  }

  const dotenvKeys = (main.configDotenv({ path: keysFilepath }).parsed || {})
  const dotenvVault = (main.configDotenv({ path: vaultFilepath }).parsed || {})

  Object.entries(dotenvKeys).forEach(([dotenvKey, value]) => {
    // determine environment
    const environment = dotenvKey.replace('DOTENV_KEY_', '').toLowerCase()
    // determine corresponding vault key
    const vaultKey = `DOTENV_VAULT_${environment.toUpperCase()}`

    // attempt to find ciphertext
    const ciphertext = dotenvVault[vaultKey]

    // give warning if not found
    if (ciphertext && ciphertext.length >= 1) {
      const key = helpers._parseEncryptionKeyFromDotenvKey(value.trim())

      // Decrypt
      const decrypted = main.decrypt(ciphertext, key)

      // envFilename
      let envFilename = `.env.${environment}`
      if (environment === 'development') {
        envFilename = '.env'
      }

      // check if exists
      if (fs.existsSync(envFilename) && (fs.readFileSync(envFilename, { encoding: ENCODING }).toString() === decrypted)) {
        unchangedEnvFilenames.add(envFilename)
      } else {
        changedEnvFilenames.add(envFilename)
        fs.writeFileSync(envFilename, decrypted)
      }
    } else {
      logger.warn(`${vaultKey} missing in .env.vault: ${vaultFilepath}`)
    }
  })

  let changedMsg = ''
  if (changedEnvFilenames.size > 0) {
    changedMsg = `decrypted (${Array.from(changedEnvFilenames).join(',')})`
  }

  let unchangedMsg = ''
  if (unchangedEnvFilenames.size > 0) {
    unchangedMsg = `no changes (${Array.from(unchangedEnvFilenames).join(',')})`
  }

  if (changedMsg.length > 0) {
    spinner.succeed(`${changedMsg} ${unchangedMsg}`)
  } else {
    spinner.done(`${unchangedMsg}`)
  }
}

module.exports = decrypt
