const logger = require('./../../shared/logger')
const createSpinner = require('./../../shared/createSpinner')
const sleep = require('./../../lib/helpers/sleep')

const main = require('./../../lib/main')

const spinner = createSpinner('encrypting')

async function encryptme () {
  spinner.start()
  await sleep(500) // better dx

  const options = this.opts()
  logger.debug(`options: ${JSON.stringify(options)}`)

  try {
    const {
      processedEnvFiles,
      changedFilepaths,
      unchangedFilepaths
    } = main.encryptme(options.envFile)

    for (const processedEnvFile of processedEnvFiles) {
      logger.verbose(`encrypting ${processedEnvFile.filepath}`)
      if (processedEnvFile.error) {
        if (processedEnvFile.error.code === 'MISSING_ENV_FILE') {
          logger.warn(processedEnvFile.error)
          logger.help(`? add one with [echo "HELLO=World" > ${processedEnvFile.filepath}] and re-run [dotenvx encryptme]`)
        } else {
          logger.warn(processedEnvFile.error)
        }
      } else {
        // logger.verbose(`${processedEnvFile.key} set`)
        // logger.debug(`${processedEnvFile.key} set to ${processedEnvFile.value}`)
      }
    }

    if (changedFilepaths.length > 0) {
      spinner.succeed(`encrypted (${changedFilepaths.join(', ')})`)
      logger.help2(`ℹ commit encrypted changes to code: [git commit -am "encrypt ${changedFilepaths.join(',')}"]`)
    } else {
      spinner.done(`no changes (${unchangedFilepaths})`)
    }
  } catch (error) {
    logger.error(error.message)
    if (error.help) {
      logger.help(error.help)
    }
  }
}

module.exports = encryptme
