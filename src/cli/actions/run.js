const fs = require('fs')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const main = require('./../../lib/main')

const ENCODING = 'utf8'

function run () {
  const options = this.opts()
  logger.debug('configuring options')
  logger.debug(options)

  // load from .env.vault file
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    const filepath = helpers.resolvePath('.env.vault')

    if (!fs.existsSync(filepath)) {
      logger.error(`you set DOTENV_KEY but your .env.vault file is missing: ${filepath}`)
    } else {
      logger.verbose(`loading env from encrypted ${filepath}`)

      try {
        logger.debug(`reading encrypted env from ${filepath}`)
        const src = fs.readFileSync(filepath, { encoding: ENCODING })

        logger.debug(`parsing encrypted env from ${filepath}`)
        const parsedVault = main.parse(src)

        logger.debug(`decrypting encrypted env from ${filepath}`)
        // handle scenario for comma separated keys - for use with key rotation
        // example: DOTENV_KEY="dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenv.org/vault/.env.vault?environment=prod"
        const dotenvKeys = process.env.DOTENV_KEY.split(',')
        const length = dotenvKeys.length

        let decrypted
        for (let i = 0; i < length; i++) {
          try {
            // Get full dotenvKey
            const dotenvKey = dotenvKeys[i].trim()

            const key = helpers._parseEncryptionKeyFromDotenvKey(dotenvKey)
            const ciphertext = helpers._parseCipherTextFromDotenvKeyAndParsedVault(dotenvKey, parsedVault)

            // Decrypt
            decrypted = main.decrypt(ciphertext, key)

            break
          } catch (error) {
            // last key
            if (i + 1 >= length) {
              throw error
            }
            // try next key
          }
        }
        logger.debug(decrypted)

        logger.debug(`parsing decrypted env from ${filepath}`)
        const parsed = main.parse(decrypted)

        logger.debug(`writing decrypted env from ${filepath}`)
        const result = main.write(process.env, parsed, options.overload)

        logger.info(`loading env (${result.written.size}) from encrypted .env.vault`)
      } catch (e) {
        logger.error(e)
      }
    }
  } else {
    // convert to array if needed
    let optionEnvFile = options.envFile
    if (!Array.isArray(optionEnvFile)) {
      optionEnvFile = [optionEnvFile]
    }

    const readableFilepaths = new Set()
    const written = new Set()

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)

      logger.verbose(`loading env from ${filepath}`)

      try {
        logger.debug(`reading env from ${filepath}`)
        const src = fs.readFileSync(filepath, { encoding: ENCODING })

        logger.debug(`parsing env from ${filepath}`)
        const parsed = main.parse(src)

        logger.debug(`writing env from ${filepath}`)
        const result = main.write(process.env, parsed, options.overload)

        readableFilepaths.add(envFilepath)
        result.written.forEach(key => written.add(key))
      } catch (e) {
        logger.warn(e)
      }
    }

    if (readableFilepaths.size > 0) {
      logger.info(`loading env (${written.size}) from ${[...readableFilepaths]}`)
    }
  }

  // Extract command and arguments after '--'
  const commandIndex = process.argv.indexOf('--')
  if (commandIndex === -1 || commandIndex === process.argv.length - 1) {
    logger.error('missing command after [dotenvx run --]')
    logger.error('')
    logger.error('  get help: [dotenvx help run]')
    logger.error('  or try:   [dotenvx run -- npm run dev]')
    process.exit(1)
  } else {
    const subCommand = process.argv.slice(commandIndex + 1)

    helpers.executeCommand(subCommand, process.env)
  }
}

module.exports = run
