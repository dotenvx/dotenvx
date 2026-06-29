const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')
const normalizeArmorAliases = require('./normalizeArmorAliases')

const decryptTransform = require('./../../lib/transforms/decrypt')

async function decrypt () {
  const options = normalizeArmorAliases(this.opts())
  const spinner = await createSpinner({ ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const envs = this.envs
  const sesh = new Session()
  const noArmor = options.armor === false || (await sesh.noArmor())

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    if (spinner) spinner.stop()
    const {
      processedEnvs
    } = await decryptTransform({ envs, ik: options.key, ek: options.excludeKey, fk: options.envKeysFile, noArmor, command: process.argv.slice(2) })

    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
      } else {
        console.log(processedEnv.envSrc)
      }
    }

    if (errorCount > 0) {
      process.exit(1)
    } else {
      process.exit(0) // exit early
    }
  } else {
    try {
      if (spinner) spinner.stop()
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await decryptTransform({ envs, ik: options.key, ek: options.excludeKey, fk: options.envKeysFile, noArmor, command: process.argv.slice(2) })

      for (const processedEnv of processedEnvs) {
        logger.verbose(`decrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)

        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp || processedEnv.error.message)
        }

        if (processedEnv.changed) {
          await fsx.writeFileX(processedEnv.filepath, processedEnv.envSrc)

          logger.verbose(`decrypted ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        } else {
          logger.verbose(`no change ${processedEnv.envFilepath} (${processedEnv.filepath})`)
        }
      }

      if (spinner) spinner.stop()
      if (changedFilepaths.length > 0) {
        logger.success(`◇ decrypted (${changedFilepaths.join(',')})`)
      } else if (unchangedFilepaths.length > 0) {
        logger.info(`○ no change (${unchangedFilepaths})`)
      } else {
        // do nothing - scenario when no .env files found
      }

      if (errorCount > 0) {
        process.exit(1)
      }
    } catch (error) {
      if (spinner) spinner.stop()
      catchAndLog(error)
      process.exit(1)
    }
  }
}

module.exports = decrypt
