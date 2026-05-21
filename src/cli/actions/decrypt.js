const fsx = require('./../../lib/helpers/fsx')
const { logger } = require('./../../shared/logger')

const Decrypt = require('./../../lib/services/decrypt')
const catchAndLog = require('../../lib/helpers/catchAndLog')
const createSpinner = require('../../lib/helpers/createSpinner')
const Session = require('../../db/session')

async function decrypt () {
  const options = this.opts()
  const spinner = await createSpinner({ ...options, text: 'decrypting' })

  logger.debug(`options: ${JSON.stringify(options)}`)

  const sesh = new Session()
  const envs = this.envs
  const noOps = options.ops === false || (await sesh.noOps())

  let errorCount = 0

  // stdout - should not have a try so that exit codes can surface to stdout
  if (options.stdout) {
    const {
      processedEnvs
    } = await new Decrypt(envs, options.key, options.excludeKey, options.envKeysFile, noOps).run()
    if (spinner) spinner.stop()
    for (const processedEnv of processedEnvs) {
      if (processedEnv.error) {
        errorCount += 1
        logger.error(processedEnv.error.messageWithHelp)
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
      const {
        processedEnvs,
        changedFilepaths,
        unchangedFilepaths
      } = await new Decrypt(envs, options.key, options.excludeKey, options.envKeysFile, noOps).run()

      for (const processedEnv of processedEnvs) {
        logger.verbose(`decrypting ${processedEnv.envFilepath} (${processedEnv.filepath})`)

        if (processedEnv.error) {
          errorCount += 1
          logger.error(processedEnv.error.messageWithHelp)
        } else if (processedEnv.changed) {
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
