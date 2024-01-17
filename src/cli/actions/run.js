const fs = require('fs')
const logger = require('./../../shared/logger')
const helpers = require('./../helpers')
const main = require('./../../lib/main')
const { AppendToIgnores } = require('./../ignores')

const ENCODING = 'utf8'

async function run () {
  new AppendToIgnores().run()

  const commandArgs = this.args
  logger.debug(`process command [${commandArgs.join(' ')}]`)

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  // load from .env.vault file
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    const filepath = helpers.resolvePath('.env.vault')

    if (!fs.existsSync(filepath)) {
      logger.error(`you set DOTENV_KEY but your .env.vault file is missing: ${filepath}`)
    } else {
      logger.verbose(`loading env from encrypted ${filepath}`)

      try {
        const src = fs.readFileSync(filepath, { encoding: ENCODING })
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
        const parsed = main.parse(decrypted)
        const result = main.inject(process.env, parsed, options.overload)

        logger.successv(`injecting env (${result.injected.size}) from encrypted .env.vault`)
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
    const injected = new Set()

    for (const envFilepath of optionEnvFile) {
      const filepath = helpers.resolvePath(envFilepath)

      logger.verbose(`loading env from ${filepath}`)

      try {
        const src = fs.readFileSync(filepath, { encoding: ENCODING })
        const parsed = main.parse(src)
        const result = main.inject(process.env, parsed, options.overload)

        readableFilepaths.add(envFilepath)
        result.injected.forEach(key => injected.add(key))
      } catch (e) {
        switch (e.code) {
          // missing .env
          case 'ENOENT':
            logger.warnv(`missing ${envFilepath} file (${filepath})`)
            logger.help(`? in development: add one with [echo "HELLO=World" > .env] and re-run [dotenvx run -- ${commandArgs.join(' ')}]`)
            logger.help('? for production: set [DOTENV_KEY] on your server and re-deploy')
            logger.help('? for ci: set [DOTENV_KEY] on your ci and re-build')
            break

          // unhandled error
          default:
            logger.warn(e)
            break
        }
      }
    }

    if (readableFilepaths.size > 0) {
      logger.successv(`injecting env (${injected.size}) from ${[...readableFilepaths]}`)
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
    // const commandArgs = process.argv.slice(commandIndex + 1)
    await helpers.executeCommand(commandArgs, process.env)
  }
}

module.exports = run
